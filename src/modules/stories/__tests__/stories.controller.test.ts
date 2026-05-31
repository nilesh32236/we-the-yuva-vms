import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../stories.service', () => ({
  createStory: vi.fn(),
  getPublishedStories: vi.fn(),
  getStoryById: vi.fn(),
  updateStory: vi.fn(),
  deleteStory: vi.fn(),
  moderateStory: vi.fn(),
  listAllStories: vi.fn(),
}));

const svc = await import('../stories.service');

import {
  createStoryHandler,
  deleteStoryHandler,
  getStoryHandler,
  listAllStoriesHandler,
  listPublishedStoriesHandler,
  moderateStoryHandler,
  updateStoryHandler,
} from '../stories.controller';

describe('stories.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', role: 'VOLUNTEER', permissions: [], organizationId: null },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
  });

  it('createStoryHandler should return 201', async () => {
    vi.mocked(svc.createStory).mockResolvedValue({ id: 'story-1' });
    await createStoryHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('listPublishedStoriesHandler should return 200', async () => {
    vi.mocked(svc.getPublishedStories).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    await listPublishedStoriesHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getStoryHandler should return 200', async () => {
    vi.mocked(svc.getStoryById).mockResolvedValue({ id: 'story-1' });
    req.params = { id: 'story-1' };
    await getStoryHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateStoryHandler should return 200', async () => {
    vi.mocked(svc.updateStory).mockResolvedValue({ id: 'story-1' });
    req.params = { id: 'story-1' };
    await updateStoryHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteStoryHandler should return 204', async () => {
    vi.mocked(svc.deleteStory).mockResolvedValue();
    req.params = { id: 'story-1' };
    await deleteStoryHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('moderateStoryHandler should return 200', async () => {
    vi.mocked(svc.moderateStory).mockResolvedValue({ id: 'story-1', published: true });
    req.params = { id: 'story-1' };
    req.body = { published: true };
    await moderateStoryHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('listAllStoriesHandler should return 200', async () => {
    vi.mocked(svc.listAllStories).mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
    await listAllStoriesHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
