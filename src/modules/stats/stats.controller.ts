import type { NextFunction, Request, Response } from 'express';
import {
  getCoordinatorStats,
  getObserverStats,
  getVolunteerImpactData,
  getVolunteerStats,
} from './stats.service';

export async function volunteerStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getVolunteerStats(req.user!.id);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function volunteerImpactHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getVolunteerImpactData(req.user!.id);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function coordinatorStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getCoordinatorStats(req.user!.id);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function observerStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getObserverStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}
