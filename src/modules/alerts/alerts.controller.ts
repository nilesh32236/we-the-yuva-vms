import type { NextFunction, Request, Response } from 'express';
import * as service from './alerts.service';

export async function getMySubscriptionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getMySubscriptions(req.user!.id);
    res.status(200).json(result);
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
