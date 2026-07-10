import type { NextFunction, Request, Response } from 'express';
import { listBadges, getMyBadges } from './badges.service';

export async function listBadgesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const badges = await listBadges();
    res.status(200).json(badges);
  } catch (err) {
    next(err);
  }
}

export async function getMyBadgesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const badges = await getMyBadges(req.user!.id);
    res.status(200).json(badges);
  } catch (err) {
    next(err);
  }
}
