import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../feedback.service', () => ({
  submitFeedback: vi.fn(),
  getMyFeedback: vi.fn(),
  getEventFeedback: vi.fn(),
  updateFeedback: vi.fn(),
  deleteFeedback: vi.fn(),
  getEventFeedbackSummary: vi.fn(),
}));

const svc = await import('../feedback.service');

import {
  deleteFeedbackHandler,
  getEventFeedbackHandler,
  getEventFeedbackSummaryHandler,
  getMyFeedbackHandler,
  submitFeedbackHandler,
  updateFeedbackHandler,
} from '../feedback.controller';

describe('feedback.controller', () => {
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

  it('submitFeedbackHandler should return 201', async () => {
    vi.mocked(svc.submitFeedback).mockResolvedValue({ id: 'fb-1' });
    req.params = { eventId: 'evt-1' };
    await submitFeedbackHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('getMyFeedbackHandler should return 200', async () => {
    vi.mocked(svc.getMyFeedback).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    await getMyFeedbackHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateFeedbackHandler should return 200', async () => {
    vi.mocked(svc.updateFeedback).mockResolvedValue({ id: 'fb-1' });
    req.params = { eventId: 'evt-1' };
    await updateFeedbackHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteFeedbackHandler should return 204', async () => {
    vi.mocked(svc.deleteFeedback).mockResolvedValue({} as never);
    req.params = { eventId: 'evt-1' };
    await deleteFeedbackHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('getEventFeedbackHandler should return 200', async () => {
    vi.mocked(svc.getEventFeedback).mockResolvedValue([]);
    req.params = { eventId: 'evt-1' };
    await getEventFeedbackHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getEventFeedbackSummaryHandler should return 200', async () => {
    vi.mocked(svc.getEventFeedbackSummary).mockResolvedValue({
      average: 0,
      count: 0,
      distribution: {},
    });
    req.params = { eventId: 'evt-1' };
    await getEventFeedbackSummaryHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
