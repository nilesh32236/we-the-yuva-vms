import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string,
    public details?: Record<string, unknown>
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
    const fieldErrors = err.flatten().fieldErrors;
    res.status(422).json({ errors: fieldErrors });
    return;
  }

  if (err instanceof AppError) {
    if (err.status >= 500) {
      Sentry.captureException(err);
    }
    const response: Record<string, unknown> = { error: err.message };
    if (err.code) response.code = err.code;
    if (err.details) response.details = err.details;
    res.status(err.status).json(response);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const code = err.code;
    const is5xx = ['P2021', 'P2022', 'P2027', 'P2028'].includes(code);
    if (is5xx) {
      logger.error('Prisma error', { err, code });
      Sentry.captureException(err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    const is404 = ['P2001', 'P2015', 'P2016', 'P2017', 'P2018', 'P2019', 'P2020', 'P2025'].includes(code);
    if (is404) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    const is503 = ['P2023', 'P2024'].includes(code);
    if (is503) {
      res.status(503).json({ error: 'Database temporarily unavailable' });
      return;
    }
    res.status(400).json({ error: 'Database request error' });
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error('Prisma validation error', { err });
    Sentry.captureException(err);
    res.status(400).json({ error: 'Invalid data provided' });
    return;
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    logger.error('Prisma initialization error', { err });
    Sentry.captureException(err);
    res.status(503).json({ error: 'Service temporarily unavailable' });
    return;
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    logger.error('Prisma unknown error', { err });
    Sentry.captureException(err);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    Sentry.captureException(err);
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }

  const multerErr = err as { code?: string; name?: string };
  if (multerErr.name === 'MulterError') {
    Sentry.captureException(err);
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File too large. Maximum size is 10MB.',
      LIMIT_PART_COUNT: 'Too many files',
      LIMIT_FILE_COUNT: 'Too many files',
      LIMIT_FIELD_KEY: 'Field name too long',
      LIMIT_FIELD_VALUE: 'Field value too long',
      LIMIT_FIELD_COUNT: 'Too many fields',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
    };
    res.status(400).json({ error: messages[multerErr.code ?? ''] || 'File upload error' });
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
