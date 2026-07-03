import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../blog.service', () => ({
  createPost: vi.fn(),
  getPublishedPosts: vi.fn(),
  getPostBySlug: vi.fn(),
  getPostById: vi.fn(),
  updatePost: vi.fn(),
  publishPost: vi.fn(),
  archivePost: vi.fn(),
  deletePost: vi.fn(),
  listAllPosts: vi.fn(),
}));

const svc = await import('../blog.service');

import {
  archiveHandler, createHandler, deleteHandler,
  getByIdHandler, getPublishedBySlugHandler,
  listAllHandler, listPublishedHandler, publishHandler, updateHandler,
} from '../blog.controller';

describe('blog.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {}, params: { id: 'p1' }, query: {},
      user: { id: 'admin-1', role: 'ADMIN', permissions: [], organizationId: null },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
  });

  it('createHandler should return 201', async () => {
    vi.mocked(svc.createPost).mockResolvedValue({ id: 'p1' } as never);
    await createHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('listPublishedHandler should return 200', async () => {
    vi.mocked(svc.getPublishedPosts).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 } as never);
    await listPublishedHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getByIdHandler should return 200', async () => {
    vi.mocked(svc.getPostById).mockResolvedValue({ id: 'p1' } as never);
    await getByIdHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteHandler should return 204', async () => {
    vi.mocked(svc.deletePost).mockResolvedValue(undefined as never);
    await deleteHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
