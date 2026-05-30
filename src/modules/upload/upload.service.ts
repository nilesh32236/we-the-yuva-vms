import multer from 'multer';
import path from 'path';

const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm',
  'application/pdf',
]);

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const extAllowed = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|pdf)$/i.test(path.extname(file.originalname));
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
