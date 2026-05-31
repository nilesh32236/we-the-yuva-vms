import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { addCoordinator, listCoordinators, removeCoordinator } from './coordinators.service';

export async function addCoordinatorHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    if (!name || !email) throw new AppError('name and email are required', 400);

    const user = await addCoordinator(id, req.user!.id, { name, email });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function listCoordinatorsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const coordinators = await listCoordinators(req.params.id);
    res.status(200).json(coordinators);
  } catch (err) {
    next(err);
  }
}

export async function removeCoordinatorHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await removeCoordinator(req.params.id, req.params.userId, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
