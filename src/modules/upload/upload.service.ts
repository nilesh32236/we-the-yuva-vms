import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

// TODO: use S3/cloud storage for production - local disk is not persistent
// HF Spaces has read-only filesystem; use /tmp/uploads or cloud storage
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure uploads directory exists at module load time (fail fast)
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
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
  cb(new Error('Only images (jpg, png, gif, webp, svg), videos (mp4, webm), and PDFs are allowed'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function getUploadUrl(filename: string): string {
  return `/uploads/${filename}`;
}
