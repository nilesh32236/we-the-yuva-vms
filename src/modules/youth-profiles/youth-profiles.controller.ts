import type { NextFunction, Request, Response } from 'express';
import * as service from './youth-profiles.service';

export async function getYouthProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await service.getYouthProfile(req.user!.id);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

export async function submitInitialAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.submitInitialAssessment(req.user!.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function submitReflectionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.submitReflection(req.user!.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
