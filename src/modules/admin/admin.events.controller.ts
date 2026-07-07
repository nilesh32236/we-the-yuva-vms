import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export async function adminListEventsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const where = { status: { not: 'CANCELLED' as const } };

    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { eventDate: 'desc' },
        include: {
          opportunity: { select: { title: true, organization: { select: { name: true } } } },
          _count: { select: { attendances: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.status(200).json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function adminGetEventHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        opportunity: {
          select: {
            title: true,
            organization: { select: { name: true } },
            createdBy: { select: { name: true } },
          },
        },
        _count: { select: { attendances: true } },
      },
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.status(200).json(event);
  } catch (err) {
    next(err);
  }
}
