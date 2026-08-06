import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../../lib/logger';

// HF Spaces has read-only filesystem except /tmp; use env var or /tmp/uploads
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || '/tmp/uploads');

let uploadsDirReady = false;

async function ensureUploadsDir() {
  if (uploadsDirReady) return;
  try {
    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    uploadsDirReady = true;
  } catch (err) {
    logger.error('Failed to create uploads directory', { error: (err as Error).message });
    throw new AppError(`Uploads directory not writable at ${UPLOADS_DIR}`, 500);
  }
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureUploadsDir();
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
]);

// Sniff file content (magic bytes) rather than trusting the client-supplied
// mimetype, so a spoofed MIME prefix cannot smuggle arbitrary content through
// /upload. Returns the detected family, or null when unrecognized.
function sniffContentType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  // GIF
  if (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a') {
    return 'image/gif';
  }
  // WebP: RIFF....WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.length >= 12 &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  // SVG: XML document containing <svg (peek within the first 1KB)
  const head = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
  if (/<svg[\s>]/.test(head) || (/^<\?xml/.test(head) && /<svg[\s>]/.test(head))) {
    return 'image/svg+xml';
  }
  // PDF
  if (buffer.toString('ascii', 0, 4) === '%PDF') return 'application/pdf';
  // MP4/MOV: box header with 'ftyp' at offset 4
  if (buffer.toString('ascii', 4, 8) === 'ftyp') return 'video/mp4';
  // WebM/Matroska: EBML magic 1A 45 DF A3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return 'video/webm';
  }

  return null;
}

function assertContentMatches(filePath: string, declaredMime: string): void {
  const head = fs.readFileSync(filePath);
  const detected = sniffContentType(head);
  // Map declared mime to its sniff family (exact match on the canonical MIME).
  if (!detected || detected !== declaredMime) {
    throw new AppError('File content does not match the declared file type', 400);
  }
}

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const extAllowed = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|pdf)$/i.test(
    path.extname(file.originalname)
  );
  const mimeAllowed = ALLOWED_MIMES.has(file.mimetype);
  if (extAllowed && mimeAllowed) return cb(null, true);
  cb(
    new AppError(
      'Only images (jpg, png, gif, webp, svg), videos (mp4, webm), and PDFs are allowed',
      400
    )
  );
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function getUploadUrl(filename: string): string {
  return `/uploads/${filename}`;
}

const isS3Configured = !!(
  process.env.S3_BUCKET_NAME &&
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY
);

const s3Client = isS3Configured
  ? new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'https://s3.hf.co',
      region: process.env.S3_REGION || 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    })
  : null;

export async function processUpload(file: Express.Multer.File): Promise<string> {
  try {
    assertContentMatches(file.path, file.mimetype);
  } catch (err) {
    await fs.promises.unlink(file.path).catch((cleanupErr) =>
      logger.warn('File cleanup failed after content validation error', {
        path: file.path,
        error: (cleanupErr as Error).message,
      })
    );
    throw err;
  }

  if (s3Client && process.env.S3_BUCKET_NAME) {
    const fileStream = fs.createReadStream(file.path);
    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: file.filename,
          Body: fileStream,
          ContentType: file.mimetype,
        },
      });
      await upload.done();

      // Clean up the local temp file after successful upload
      try {
        await fs.promises.unlink(file.path);
      } catch (err) {
        logger.warn(`Failed to delete local temp file ${file.path}:`, { error: (err as Error).message });
      }

      // Construct direct URL (S3 standard structure or custom S3 endpoint mapping)
      const endpoint = process.env.S3_ENDPOINT || 'https://s3.hf.co';
      const namespace = process.env.S3_NAMESPACE;
      const provider = process.env.S3_PROVIDER;
      if (provider === 'hf' && namespace) {
        return `https://huggingface.co/api/buckets/${namespace}/${process.env.S3_BUCKET_NAME}/${file.filename}`;
      }
      return `${endpoint}/${process.env.S3_BUCKET_NAME}/${file.filename}`;
    } catch (err) {
      await fs.promises.unlink(file.path).catch((cleanupErr) =>
        logger.warn('File cleanup failed after S3 error', {
          path: file.path,
          error: (cleanupErr as Error).message,
        })
      );
      throw err;
    }
  }

  // Fallback to local url
  return `/uploads/${file.filename}`;
}
