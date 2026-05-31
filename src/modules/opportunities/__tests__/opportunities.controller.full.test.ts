import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../opportunities.service', () => ({
  listOpportunities: vi.fn(),
  createOpportunity: vi.fn(),
  getOpportunityById: vi.fn(),
  updateOpportunity: vi.fn(),
  closeOpportunity: vi.fn(),
  applyToOpportunity: vi.fn(),
  listMyApplications: vi.fn(),
  listApplications: vi.fn(),
  updateApplicationStatus: vi.fn(),
  withdrawApplication: vi.fn(),
  invalidateListCache: vi.fn(),
}));

vi.mock('../matching.service', () => ({
  getRecommendedOpportunities: vi.fn(),
}));

const svc = await import('../opportunities.service');
const matching = await import('../matching.service');

import {
  applyHandler,
  closeOpportunityHandler,
  createOpportunityHandler,
  getOpportunityHandler,
  listApplicationsHandler,
  listMyApplicationsHandler,
  recommendedHandler,
  updateApplicationStatusHandler,
  updateOpportunityHandler,
  withdrawApplicationHandler,
} from '../opportunities.controller';

describe('opportunities.controller full coverage', () => {
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

  it('createOpportunityHandler should return 201', async () => {
    vi.mocked(svc.createOpportunity).mockResolvedValue({ id: 'opp-1' });
    await createOpportunityHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('recommendedHandler should return 200', async () => {
    vi.mocked(matching.getRecommendedOpportunities).mockResolvedValue([]);
    await recommendedHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getOpportunityHandler should return 200', async () => {
    vi.mocked(svc.getOpportunityById).mockResolvedValue({ id: 'opp-1' });
    req.params = { id: 'opp-1' };
    await getOpportunityHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateOpportunityHandler should return 200', async () => {
    vi.mocked(svc.updateOpportunity).mockResolvedValue({ id: 'opp-1' });
    req.params = { id: 'opp-1' };
    await updateOpportunityHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('closeOpportunityHandler should return 204', async () => {
    vi.mocked(svc.closeOpportunity).mockResolvedValue({} as never);
    req.params = { id: 'opp-1' };
    await closeOpportunityHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('applyHandler should return 201', async () => {
    vi.mocked(svc.applyToOpportunity).mockResolvedValue({ id: 'app-1' });
    req.params = { id: 'opp-1' };
    await applyHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('listApplicationsHandler should return 200', async () => {
    vi.mocked(svc.listApplications).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    req.params = { id: 'opp-1' };
    await listApplicationsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateApplicationStatusHandler should return 200', async () => {
    vi.mocked(svc.updateApplicationStatus).mockResolvedValue({ id: 'app-1', status: 'ACCEPTED' });
    req.params = { id: 'opp-1', appId: 'app-1' };
    req.body = { status: 'ACCEPTED' };
    await updateApplicationStatusHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('withdrawApplicationHandler should return 204', async () => {
    vi.mocked(svc.withdrawApplication).mockResolvedValue({} as never);
    req.params = { id: 'app-1' };
    await withdrawApplicationHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('listMyApplicationsHandler should return 200', async () => {
    vi.mocked(svc.listMyApplications).mockResolvedValue([]);
    await listMyApplicationsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
