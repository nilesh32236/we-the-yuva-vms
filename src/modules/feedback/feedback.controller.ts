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
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const result = await service.getMyFeedback(req.user!.id, { page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateFeedbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.updateFeedback(req.params.eventId, req.user!.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteFeedbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteFeedback(req.params.eventId, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getEventFeedbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = req.query.page
      ? Math.max(1, parseInt(req.query.page as string, 10) || 1)
      : undefined;
    const limit = page
      ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20))
      : undefined;
    const pagination = page ? { page, limit: limit! } : undefined;
    // TODO: return consistent pagination envelope even when not paginated (production)
    const result = await service.getEventFeedback(req.params.eventId, pagination);
    res.status(200).json(result);
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
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
