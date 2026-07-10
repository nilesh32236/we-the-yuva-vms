// Phase 2 (future): Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
import type { NextFunction, Request, Response } from 'express';
import * as service from './alerts.service';

export async function getMySubscriptionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = req.query.page
      ? Math.max(1, Number.parseInt(req.query.page as string, 10) || 1)
      : undefined;
    const limit = page
      ? Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20))
      : undefined;
    const pagination = page ? { page, limit: limit! } : undefined;
    const result = await service.getMySubscriptions(req.user!.id, pagination);
    res.status(200).json(pagination ? result : { data: result });
  } catch (err) {
    next(err);
  }
}

export async function createSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.createSubscription(req.user!.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.updateSubscription(req.params.id, req.user!.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteSubscription(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
