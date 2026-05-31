import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export async function listRolesHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, permissions: true },
    });

    res.status(200).json({ roles });
  } catch (err) {
    next(err);
  }
}
