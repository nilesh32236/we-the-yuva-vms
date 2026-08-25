import type { NextFunction, Request, Response } from 'express';
import {
  getCoordinatorStats,
  getObserverStats,
  getVolunteerImpactData,
  getVolunteerStats,
} from './stats.service';

function noStore(res: Response) {
  (res as unknown as { setHeader?: (k: string, v: string) => void }).setHeader?.('Cache-Control', 'no-store, no-cache, must-revalidate');
  (res as unknown as { setHeader?: (k: string, v: string) => void }).setHeader?.('Pragma', 'no-cache');
}

export async function volunteerStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getVolunteerStats(req.user!.id);
    noStore(res);
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
    noStore(res);
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
    const stats = await getCoordinatorStats(req.user!.id, req.user!.organizationId);
    noStore(res);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function observerStatsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getObserverStats();
    noStore(res);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}
