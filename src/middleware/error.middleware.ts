import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'Validation failed',
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Resource already exists' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }

  const multerErr = err as { code?: string; name?: string };
  if (multerErr.code === 'LIMIT_FILE_SIZE' || multerErr.name === 'MulterError') {
    res.status(400).json({ error: (err as Error).message || 'File upload error' });
    return;
  }

  // Multer/file upload errors
  const errorMsg = (err as Error).message?.toLowerCase() ?? '';
  if (errorMsg.includes('file type') || errorMsg.includes('only')) {
    res.status(400).json({ error: (err as Error).message });
    return;
  }

  const error = err as Error;
  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
  });

  res.status(500).json({ error: 'Internal server error' });
}
