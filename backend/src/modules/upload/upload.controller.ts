import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { processUpload } from './upload.service';
import { env } from '../../config/env';

function sanitizedBaseUrl(req: Request): string {
  if (env.BASE_URL) {
    return env.BASE_URL.replace(/\/$/, '');
  }
  if ((env.NODE_ENV as string) === 'production') {
    throw new AppError('BASE_URL must be configured in production', 500);
  }
  const rawHost = (req.get('X-Forwarded-Host') || req.get('host') || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (!rawHost) return `${req.protocol}://localhost`;
  // Basic shape validation
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/.test(rawHost) || rawHost.includes('..') || rawHost.includes('@')) {
    throw new AppError('Invalid host header', 400);
  }
  // In production, derived host must be allowlisted; in dev/test allow any syntactically valid host for convenience
  if ((env.NODE_ENV as string) === 'production') {
    const allowedHosts = env.FRONTEND_URL.split(',')
      .map((o) => {
        try {
          return new URL(o.trim()).host.toLowerCase();
        } catch {
          return o.trim().toLowerCase();
        }
      })
      .filter(Boolean);
    const isAllowed =
      allowedHosts.includes(rawHost) ||
      rawHost === 'localhost' ||
      rawHost.startsWith('localhost:');
    if (!isAllowed) {
      throw new AppError('Host not allowed', 400);
    }
  }
  return `${req.protocol}://${rawHost}`;
}

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
    const isPrivate = (req.body as { visibility?: string })?.visibility === 'private';
    const url = await processUpload(req.file, isPrivate);
    const baseUrl = sanitizedBaseUrl(req);
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    res.status(201).json({ url: fullUrl, filename: req.file.filename });
  } catch (err) {
    next(err);
  }
}
