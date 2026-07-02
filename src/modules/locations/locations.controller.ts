import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export async function listLocationsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ data: locations });
  } catch (err) {
    next(err);
  }
}
