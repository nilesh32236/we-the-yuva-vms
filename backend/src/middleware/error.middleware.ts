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
    if (err.status >= 500 || err.status === 429 || err.status === 403) {
      Sentry.captureException(err);
    }
    const response: Record<string, unknown> = { error: err.message };
    if (err.code) response.code = err.code;
    if (err.details) response.details = err.details;
    res.status(err.status).json(response);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2000':
        res.status(400).json({ error: 'Value too long for column' });
        return;
      case 'P2001':
        Sentry.captureException(err);
        res.status(404).json({ error: 'Record not found' });
        return;
      case 'P2030':
        Sentry.captureException(err);
        res.status(400).json({ error: 'Database query error' });
        return;
      case 'P2002':
        res.status(409).json({ error: 'Resource already exists' });
        return;
      case 'P2003':
        res.status(400).json({ error: 'Referenced resource does not exist' });
        return;
      case 'P2004':
      case 'P2005':
      case 'P2006':
      case 'P2007':
      case 'P2008':
      case 'P2009':
      case 'P2010':
      case 'P2011':
      case 'P2012':
      case 'P2013':
        res.status(400).json({ error: 'Database constraint error' });
        return;
      case 'P2014':
        res.status(400).json({ error: 'Required relation would be violated' });
        return;
      case 'P2015':
      case 'P2016':
      case 'P2017':
      case 'P2018':
      case 'P2019':
      case 'P2020':
        res.status(404).json({ error: 'Related record not found' });
        return;
      case 'P2021':
        logger.error('Prisma: Table not found - check migrations', { err });
        Sentry.captureException(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      case 'P2022':
        logger.error('Prisma: Column not found - check schema', { err });
        Sentry.captureException(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      case 'P2023':
      case 'P2024':
        res.status(503).json({ error: 'Database temporarily unavailable' });
        return;
      case 'P2025':
        res.status(404).json({ error: 'Resource not found' });
        return;
      case 'P2026':
        res.status(400).json({ error: 'Unsupported database operation' });
        return;
      case 'P2027':
      case 'P2028':
        logger.error('Prisma: Internal database error', { err, code: err.code });
        Sentry.captureException(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      default:
        logger.error('Unhandled Prisma error', { err, code: err.code });
        Sentry.captureException(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
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
