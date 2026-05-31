import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  listEventsByOpportunity: vi.fn(),
}));

const svc = await import('../events.service');

import {
  cancelEventHandler,
  checkInHandler,
  checkOutHandler,
  createEventHandler,
  exportEventsCsvHandler,
  getAttendanceListHandler,
  getEventHandler,
  getEventQrCodeHandler,
  getMyEventsHandler,
  listEventsByOpportunityHandler,
  markAttendanceHandler,
  updateEventHandler,
} from '../events.controller';

describe('events.controller full coverage', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'coord-1', role: 'COORDINATOR', permissions: [], organizationId: 'org-1' },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
  });

  it('createEventHandler should return 201', async () => {
    vi.mocked(svc.createEvent).mockResolvedValue({ id: 'event-1' });
    req.params = { opportunityId: 'opp-1' };
    await createEventHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('listEventsByOpportunityHandler should return 200', async () => {
    vi.mocked(svc.listEventsByOpportunity).mockResolvedValue([]);
    req.params = { opportunityId: 'opp-1' };
    await listEventsByOpportunityHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getEventHandler should return 200', async () => {
    vi.mocked(svc.getEventById).mockResolvedValue({ id: 'event-1' });
    req.params = { id: 'event-1' };
    await getEventHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateEventHandler should return 200', async () => {
    vi.mocked(svc.updateEvent).mockResolvedValue({ id: 'event-1' });
    req.params = { id: 'event-1' };
    await updateEventHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('cancelEventHandler should return 204', async () => {
    vi.mocked(svc.cancelEvent).mockResolvedValue({} as never);
    req.params = { id: 'event-1' };
    await cancelEventHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('getEventQrCodeHandler should return 200', async () => {
    vi.mocked(svc.getOrCreateEventQrToken).mockResolvedValue({
      token: 'qr-token',
      expiresAt: new Date(),
      eventDate: new Date(),
      eventTitle: 'Test',
    });
    req.params = { id: 'event-1' };
    await getEventQrCodeHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('markAttendanceHandler should return 200', async () => {
    vi.mocked(svc.markAttendance).mockResolvedValue(10);
    req.params = { id: 'event-1' };
    req.body = { attendances: [{ volunteerId: 'v1', attended: true }] };
    await markAttendanceHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getAttendanceListHandler should return 200', async () => {
    vi.mocked(svc.getAttendanceList).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    req.params = { id: 'event-1' };
    await getAttendanceListHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getMyEventsHandler should return 200', async () => {
    vi.mocked(svc.getMyEvents).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    await getMyEventsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('checkInHandler should return 200', async () => {
    vi.mocked(svc.checkIn).mockResolvedValue({ id: 'att-1' });
    req.params = { id: 'event-1' };
    await checkInHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('checkOutHandler should return 200', async () => {
    vi.mocked(svc.checkOut).mockResolvedValue({ id: 'att-1' });
    req.params = { id: 'event-1' };
    await checkOutHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('exportEventsCsvHandler should set CSV headers', async () => {
    vi.mocked(svc.exportEventsCsv).mockResolvedValue('header\nrow1');
    await exportEventsCsvHandler(req as Request, res as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
  });
});
