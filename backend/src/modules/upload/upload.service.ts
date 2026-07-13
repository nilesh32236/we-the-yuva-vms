import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { AppError } from '../../middleware/error.middleware';

// TODO: use S3/cloud storage for production - local disk is not persistent
// HF Spaces has read-only filesystem; use /tmp/uploads or cloud storage
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

let uploadsDirReady = false;

async function ensureUploadsDir() {
  if (uploadsDirReady) return;
  try {
    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    uploadsDirReady = true;
  } catch {
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
  cb(new AppError('Only images (jpg, png, gif, webp, svg), videos (mp4, webm), and PDFs are allowed', 400));
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
        console.warn(`Failed to delete local temp file ${file.path}:`, err);
      }

      // Construct direct URL (S3 standard structure or custom S3 endpoint mapping)
      const endpoint = process.env.S3_ENDPOINT || 'https://s3.hf.co';
      const namespace = process.env.S3_NAMESPACE;
      if (endpoint.includes('s3.hf.co') && namespace) {
        return `https://huggingface.co/api/buckets/${namespace}/${process.env.S3_BUCKET_NAME}/${file.filename}`;
      }
      return `${endpoint}/${process.env.S3_BUCKET_NAME}/${file.filename}`;
    } catch (err) {
      await fs.promises.unlink(file.path).catch(() => {});
      throw err;
    }
  }

  // Fallback to local url
  return `/uploads/${file.filename}`;
}
