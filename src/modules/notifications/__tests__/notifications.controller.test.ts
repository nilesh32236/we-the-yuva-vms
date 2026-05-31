import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../notifications.service', () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  getNotifications: vi.fn(),
  getNotification: vi.fn(),
  deleteNotification: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  getUnreadCount: vi.fn(),
}));

const svc = await import('../notifications.service');

import {
  deleteNotificationHandler,
  getNotificationHandler,
  listNotificationsHandler,
  markAllReadHandler,
  markReadHandler,
  subscribeHandler,
  unreadCountHandler,
  unsubscribeHandler,
} from '../notifications.controller';

describe('notifications.controller', () => {
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

  it('subscribeHandler should return 201', async () => {
    vi.mocked(svc.subscribe).mockResolvedValue({ ok: true });
    await subscribeHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('unsubscribeHandler should return 200', async () => {
    vi.mocked(svc.unsubscribe).mockResolvedValue({ ok: true });
    req.body = { endpoint: 'https://end' };
    await unsubscribeHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('listNotificationsHandler should return 200', async () => {
    vi.mocked(svc.getNotifications).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    await listNotificationsHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getNotificationHandler should return 200', async () => {
    vi.mocked(svc.getNotification).mockResolvedValue({ id: 'n1' });
    req.params = { id: 'n1' };
    await getNotificationHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteNotificationHandler should return 204', async () => {
    vi.mocked(svc.deleteNotification).mockResolvedValue(undefined as never);
    req.params = { id: 'n1' };
    await deleteNotificationHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('markReadHandler should return 200', async () => {
    vi.mocked(svc.markRead).mockResolvedValue({ id: 'n1', read: true });
    req.params = { id: 'n1' };
    await markReadHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('markAllReadHandler should return 200', async () => {
    vi.mocked(svc.markAllRead).mockResolvedValue({ ok: true });
    await markAllReadHandler(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('unreadCountHandler should return count', async () => {
    vi.mocked(svc.getUnreadCount).mockResolvedValue(3);
    await unreadCountHandler(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalledWith({ count: 3 });
  });
});
