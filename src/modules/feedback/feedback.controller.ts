import type { NextFunction, Request, Response } from 'express';
import * as service from './feedback.service';

export async function submitFeedbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.submitFeedback(req.params.eventId, req.user!.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMyFeedbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getMyFeedback(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEventFeedbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getEventFeedback(req.params.eventId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEventFeedbackSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await service.getEventFeedbackSummary(req.params.eventId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
