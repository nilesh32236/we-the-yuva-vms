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
    const fullUrl = url.startsWith('http') ? url : `${req.protocol}://${req.get('host')}${url}`;
    res.status(201).json({ url: fullUrl, filename: req.file.filename });
  } catch (err) {
    next(err);
  }
}
