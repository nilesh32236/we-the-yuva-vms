import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../alerts.service', () => ({
  getMySubscriptions: vi.fn(),
  createSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  deleteSubscription: vi.fn(),
}));

const svc = await import('../alerts.service');

import {
  createSubscriptionHandler,
  deleteSubscriptionHandler,
  getMySubscriptionsHandler,
  updateSubscriptionHandler,
} from '../alerts.controller';

describe('alerts.controller', () => {
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

  it('getMySubscriptionsHandler should return 200', async () => {
    vi.mocked(svc.getMySubscriptions).mockResolvedValue([]);
    await getMySubscriptionsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('createSubscriptionHandler should return 201', async () => {
    vi.mocked(svc.createSubscription).mockResolvedValue({ id: 'sub-1' });
    await createSubscriptionHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateSubscriptionHandler should return 200', async () => {
    vi.mocked(svc.updateSubscription).mockResolvedValue({ id: 'sub-1' });
    req.params = { id: 'sub-1' };
    await updateSubscriptionHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteSubscriptionHandler should return 204', async () => {
    vi.mocked(svc.deleteSubscription).mockResolvedValue({} as never);
    req.params = { id: 'sub-1' };
    await deleteSubscriptionHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
