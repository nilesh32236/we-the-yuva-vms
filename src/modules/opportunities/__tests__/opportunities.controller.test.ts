import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listOpportunitiesHandler } from '../opportunities.controller';
import * as service from '../opportunities.service';

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
  invalidateListCache: vi.fn(),
}));

describe('opportunities controller pagination caps', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      query: {},
      user: { id: 'test-user-id' },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
  });

  it('should cap limit to 100 when a large limit is requested', async () => {
    req.query = { limit: '1000' };

    await listOpportunitiesHandler(req as Request, res as Response, next);

    expect(service.listOpportunities).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: 100 }),
      'test-user-id'
    );
  });

  it('should use default limit of 20 when limit is 0 or negative', async () => {
    req.query = { limit: '0' };
    await listOpportunitiesHandler(req as Request, res as Response, next);
    expect(service.listOpportunities).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: 20 }),
      'test-user-id'
    );

    vi.clearAllMocks();
    req.query = { limit: '-5' };
    await listOpportunitiesHandler(req as Request, res as Response, next);
    expect(service.listOpportunities).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: 1 }),
      'test-user-id'
    );
  });

  it('should handle malformed limit strings gracefully', async () => {
    req.query = { limit: 'abc' };

    await listOpportunitiesHandler(req as Request, res as Response, next);

    expect(service.listOpportunities).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: 20 }),
      'test-user-id'
    );
    expect(next).not.toHaveBeenCalled();
  });
});
