import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@sentry/node', () => ({
  default: { captureException: vi.fn() },
  captureException: vi.fn(),
}));

import { AppError, errorMiddleware } from '../error.middleware';

describe('errorMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { path: '/test', method: 'GET' };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as never;
    next = vi.fn() as unknown as NextFunction;
  });

  it('should handle ZodError with 422', () => {
    const zodErr = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Expected string',
      },
    ]);
    errorMiddleware(zodErr, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Expected string' }));
  });

  it('should handle AppError with status code', () => {
    const appErr = new AppError('Not Found', 404);
    errorMiddleware(appErr, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not Found' });
  });

  it('should capture Sentry for 500+ AppError', async () => {
    const { captureException } = await import('@sentry/node');
    const appErr = new AppError('Server Error', 500);
    errorMiddleware(appErr, req as Request, res as Response, next);
    expect(captureException).toHaveBeenCalledWith(appErr);
  });

  it('should handle Prisma P2002 with 409', () => {
    const prismaErr = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '5.0',
    });
    errorMiddleware(prismaErr, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should handle Prisma P2025 with 404', () => {
    const prismaErr = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '5.0',
    });
    errorMiddleware(prismaErr, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should handle SyntaxError with 400', () => {
    const syntaxErr = new SyntaxError('Invalid JSON');
    Object.assign(syntaxErr, { body: true });
    errorMiddleware(syntaxErr, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle MulterError with 400', () => {
    const multerErr = new Error('File too large');
    Object.assign(multerErr, { code: 'LIMIT_FILE_SIZE', name: 'MulterError' });
    errorMiddleware(multerErr, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle file type validation error with 400', () => {
    const fileTypeErr = new Error('Only images and PDFs are allowed');
    Object.assign(fileTypeErr, { name: 'MulterError', code: 'LIMIT_UNEXPECTED_FILE' });
    errorMiddleware(fileTypeErr, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unexpected file field' });
  });

  it('should handle generic Error with 500', () => {
    const err = new Error('Something went wrong');
    errorMiddleware(err, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('should return AppError instance', () => {
    const err = new AppError('Custom error', 400);
    expect(err instanceof AppError).toBe(true);
    expect(err.status).toBe(400);
    expect(err.message).toBe('Custom error');
  });

  it('should include code and details in response when AppError has them', () => {
    const appErr = new AppError('Profile incomplete', 403, 'PROFILE_INCOMPLETE', {
      missingFields: ['skills', 'interests'],
      completionPercentage: 50,
    });
    errorMiddleware(appErr, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Profile incomplete',
      code: 'PROFILE_INCOMPLETE',
      details: { missingFields: ['skills', 'interests'], completionPercentage: 50 },
    });
  });

  it('should handle basic AppError without code or details for backward compat', () => {
    const appErr = new AppError('Not Found', 404);
    errorMiddleware(appErr, req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not Found' });
  });
});
