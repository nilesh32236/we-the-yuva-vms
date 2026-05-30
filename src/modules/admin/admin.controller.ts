import type { NextFunction, Request, Response } from 'express';
import { getAdminStats } from '../stats/stats.service';
import { createUser, listUsers, updateUser } from './admin.service';

export async function createUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await createUser(req.user!.id, req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function listUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    const filters = {
      role: req.query.role as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    };

    const result = await listUsers(filters, { page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await updateUser(req.params.id, req.body, req.user!.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function adminStatsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getAdminStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}
