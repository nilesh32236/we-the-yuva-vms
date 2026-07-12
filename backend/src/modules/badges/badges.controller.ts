import type { NextFunction, Request, Response } from 'express';
import { listBadges, getMyBadges, listPendingApprovals, approveBadge, rejectBadge } from './badges.service';

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

export async function listPendingApprovalsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const approvals = await listPendingApprovals();
    res.status(200).json({ data: approvals });
  } catch (err) {
    next(err);
  }
}

export async function approveBadgeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, badgeId } = req.params;
    const { reviewNote } = req.body;
    const approval = await approveBadge(userId, badgeId, req.user!.id, reviewNote);
    res.status(200).json({ data: approval });
  } catch (err) {
    next(err);
  }
}

export async function rejectBadgeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, badgeId } = req.params;
    const { reviewNote } = req.body;
    const approval = await rejectBadge(userId, badgeId, req.user!.id, reviewNote);
    res.status(200).json({ data: approval });
  } catch (err) {
    next(err);
  }
}
