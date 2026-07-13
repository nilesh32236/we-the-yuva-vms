import type { NextFunction, Request, Response } from 'express';
import { processUpload } from './upload.service';

export async function uploadFileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }
    const url = await processUpload(req.file);
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host') ?? 'localhost'}`;
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    res.status(201).json({ url: fullUrl, filename: req.file.filename });
  } catch (err) {
    next(err);
  }
}
