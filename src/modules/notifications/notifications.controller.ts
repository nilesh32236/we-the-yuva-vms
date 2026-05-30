import type { NextFunction, Request, Response } from 'express';
import * as service from './notifications.service';

export async function subscribeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.subscribe(req.user!.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function unsubscribeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.unsubscribe(req.user!.id, req.body.endpoint);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listNotificationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const result = await service.getNotifications(req.user!.id, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getNotificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getNotification(req.user!.id, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteNotificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteNotification(req.user!.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function markReadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.markRead(req.user!.id, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function markAllReadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.markAllRead(req.user!.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function unreadCountHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await service.getUnreadCount(req.user!.id);
    res.json({ count });
  } catch (err) {
    next(err);
  }
}
