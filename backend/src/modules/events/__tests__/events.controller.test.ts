import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listAllEventsHandler } from '../events.controller';
import * as service from '../events.service';

vi.mock('../events.service', () => ({
  listAllEvents: vi.fn(),
  createEvent: vi.fn(),
  getEventById: vi.fn(),
  updateEvent: vi.fn(),
  cancelEvent: vi.fn(),
  registerForEvent: vi.fn(),
  unregisterFromEvent: vi.fn(),
  getMyEvents: vi.fn(),
  markAttendance: vi.fn(),
  getAttendanceList: vi.fn(),
  exportEventsCsv: vi.fn(),
  getOrCreateEventQrToken: vi.fn(),
  checkIn: vi.fn(),
  checkOut: vi.fn(),
}));

describe('events controller pagination caps', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      query: {},
      user: { id: 'admin-id', role: 'ADMIN', permissions: [], organizationId: null },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
  });

  it('should cap limit to 100 when a large limit is requested', async () => {
    req.query = { limit: '500' };

    await listAllEventsHandler(req as Request, res as Response, next);

    expect(service.listAllEvents).toHaveBeenCalledWith(
      null, // organizationId
      expect.objectContaining({ limit: 100 })
    );
  });

  it('should use default limit of 20 when limit is 0 or negative', async () => {
    req.query = { limit: '0' };
    await listAllEventsHandler(req as Request, res as Response, next);
    expect(service.listAllEvents).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ limit: 20 })
    );

    vi.clearAllMocks();
    req.query = { limit: '-10' };
    await listAllEventsHandler(req as Request, res as Response, next);
    expect(service.listAllEvents).toHaveBeenCalledWith(null, expect.objectContaining({ limit: 1 }));
  });

  it('should handle malformed limit strings gracefully', async () => {
    req.query = { limit: 'xyz' };

    await listAllEventsHandler(req as Request, res as Response, next);

    expect(service.listAllEvents).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ limit: 20 })
    );
  });
});
