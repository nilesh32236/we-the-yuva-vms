import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../../lib/logger';

// HF Spaces has read-only filesystem except /tmp; use env var or /tmp/uploads
export const PUBLIC_UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || '/tmp/uploads');
export const PRIVATE_UPLOADS_DIR = path.resolve(
  process.env.PRIVATE_UPLOADS_DIR || '/tmp/private-uploads'
);
export const TMP_UPLOADS_DIR = path.resolve(process.env.TMP_UPLOADS_DIR || '/tmp/tmp-uploads');

function isSubPath(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function validateUploadDirs(): void {
  if (isSubPath(PUBLIC_UPLOADS_DIR, PRIVATE_UPLOADS_DIR)) {
    throw new Error(
      `PRIVATE_UPLOADS_DIR (${PRIVATE_UPLOADS_DIR}) must not be equal to or inside PUBLIC_UPLOADS_DIR (${PUBLIC_UPLOADS_DIR})`
    );
  }
}
validateUploadDirs();

let uploadsDirReady = false;

async function ensureUploadsDir() {
  if (uploadsDirReady) return;
  try {
    await fs.promises.mkdir(PUBLIC_UPLOADS_DIR, { recursive: true });
    await fs.promises.mkdir(PRIVATE_UPLOADS_DIR, { recursive: true });
    await fs.promises.mkdir(TMP_UPLOADS_DIR, { recursive: true });
    uploadsDirReady = true;
  } catch (err) {
    logger.error('Failed to create uploads directory', { error: (err as Error).message });
    throw new AppError(`Uploads directory not writable`, 500);
  }
}

async function ensurePrivateUploadsDir() {
  await ensureUploadsDir();
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureUploadsDir();
    // Always write to non-public temp dir first; processUpload moves to final location
    cb(null, TMP_UPLOADS_DIR);
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
  const extAllowed = /\.(jpg|jpeg|png|gif|webp|mp4|webm|pdf)$/i.test(
    path.extname(file.originalname)
  );
  const mimeAllowed = ALLOWED_MIMES.has(file.mimetype);
  if (extAllowed && mimeAllowed) return cb(null, true);
  cb(
    new AppError(
      'Only images (jpg, png, gif, webp), videos (mp4, webm), and PDFs are allowed',
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

export function getPrivateUploadUrl(filename: string): string {
  return `/api/v1/upload/private/${filename}`;
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

export async function processUpload(
  file: Express.Multer.File,
  isPrivate = false
): Promise<string> {
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

  const filename = file.filename ?? path.basename(file.path);
  const finalUrl = isPrivate ? getPrivateUploadUrl(filename) : getUploadUrl(filename);

  if (s3Client && process.env.S3_BUCKET_NAME) {
    const fileStream = fs.createReadStream(file.path);
    try {
      const key = isPrivate ? `private/${filename}` : filename;
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
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

      return finalUrl;
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

  // Local fallback: move from temp to final directory
  await ensureUploadsDir();
  const destDir = isPrivate ? PRIVATE_UPLOADS_DIR : PUBLIC_UPLOADS_DIR;
  const destPath = path.join(destDir, filename);
  try {
    await fs.promises.rename(file.path, destPath);
  } catch {
    // Cross-device rename fallback
    await fs.promises.copyFile(file.path, destPath);
    await fs.promises.unlink(file.path).catch(() => {});
  }

  return finalUrl;
}

export function getS3Client(): S3Client | null {
  return s3Client;
}

export function isS3Enabled(): boolean {
  return isS3Configured;
}
