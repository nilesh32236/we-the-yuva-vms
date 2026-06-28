import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
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
    if (err.status >= 500) {
      Sentry.captureException(err);
    }
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({ error: 'Resource already exists' });
        return;
      case 'P2025':
        res.status(404).json({ error: 'Resource not found' });
        return;
      case 'P2003':
        res.status(400).json({ error: 'Referenced resource does not exist' });
        return;
      case 'P2014':
        res.status(400).json({ error: 'Required relation would be violated' });
        return;
      case 'P2021':
        logger.error('Prisma: Table not found - check migrations', { err });
        res.status(500).json({ error: 'Internal server error' });
        return;
      case 'P2022':
        logger.error('Prisma: Column not found - check schema', { err });
        res.status(500).json({ error: 'Internal server error' });
        return;
      default:
        logger.error('Unhandled Prisma error', { err, code: err.code });
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error('Prisma validation error', { err });
    res.status(400).json({ error: 'Invalid data provided' });
    return;
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    logger.error('Prisma initialization error', { err });
    res.status(503).json({ error: 'Service temporarily unavailable' });
    return;
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

  Sentry.captureException(error);

  res.status(500).json({ error: 'Internal server error' });
}
