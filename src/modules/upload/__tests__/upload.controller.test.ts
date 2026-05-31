import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadFileHandler } from '../upload.controller';

describe('upload.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      file: undefined,
      protocol: 'https',
      get: vi.fn().mockReturnValue('example.com') as never,
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as never;
    next = vi.fn() as unknown as NextFunction;
  });

  it('should return 400 when no file provided', async () => {
    await uploadFileHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No file provided' });
  });

  it('should return 201 with file url', async () => {
    req.file = {
      filename: 'test.jpg',
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      fieldname: 'file',
      encoding: '7bit',
      destination: '',
      path: '',
      buffer: Buffer.alloc(0),
      stream: null as never,
    };
    await uploadFileHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ filename: 'test.jpg' }));
  });
});
