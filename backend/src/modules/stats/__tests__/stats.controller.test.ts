import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../stats.service', () => ({
  getVolunteerStats: vi.fn(),
  getVolunteerImpactData: vi.fn(),
  getCoordinatorStats: vi.fn(),
  getObserverStats: vi.fn(),
}));

const svc = await import('../stats.service');

import {
  coordinatorStatsHandler,
  observerStatsHandler,
  volunteerImpactHandler,
  volunteerStatsHandler,
} from '../stats.controller';

describe('stats.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { user: { id: 'user-1', role: 'VOLUNTEER', permissions: [], organizationId: null } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    next = vi.fn() as unknown as NextFunction;
  });

  it('volunteerStatsHandler should return 200', async () => {
    vi.mocked(svc.getVolunteerStats).mockResolvedValue({
      totalHours: 10,
      eventsAttended: 5,
      applications: 3,
    });
    await volunteerStatsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('volunteerImpactHandler should return 200', async () => {
    vi.mocked(svc.getVolunteerImpactData).mockResolvedValue({
      totalHours: 10,
      eventsAttended: 5,
      applications: 3,
      storiesCount: 1,
      feedbackCount: 2,
      monthlyHours: [],
      categoryHours: [],
      categoryEvents: [],
    });
    await volunteerImpactHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('coordinatorStatsHandler should return 200', async () => {
    vi.mocked(svc.getCoordinatorStats).mockResolvedValue({
      activeVolunteers: 10,
      eventsThisMonth: 3,
      opportunities: 5,
    });
    await coordinatorStatsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('observerStatsHandler should return 200', async () => {
    vi.mocked(svc.getObserverStats).mockResolvedValue({
      totalVolunteers: 50,
      hoursServed: 200,
      activeEvents: 10,
    });
    await observerStatsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
