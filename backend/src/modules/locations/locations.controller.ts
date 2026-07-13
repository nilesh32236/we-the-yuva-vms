import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { prisma } from '../../lib/prisma';

export async function listLocationsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' },
      take: 100,
    });
    res.status(200).json({ data: locations });
  } catch (err) {
    next(err);
  }
}

export async function createLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, district, state } = req.body;

    const existing = await prisma.location.findUnique({ where: { name } });
    if (existing) {
      throw new AppError('Location with this name already exists', 409);
    }

    const location = await prisma.location.create({
      data: { name, district, state },
    });
    res.status(201).json({ data: location });
  } catch (err) {
    next(err);
  }
}
