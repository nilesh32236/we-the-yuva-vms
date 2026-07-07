import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export async function adminListOpportunitiesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { name: true } },
          organization: { select: { name: true } },
          _count: { select: { applications: true } },
        },
      }),
      prisma.opportunity.count({ where }),
    ]);

    res.status(200).json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function adminGetOpportunityHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { name: true, email: true } },
        organization: { select: { name: true, id: true } },
        location: true,
        _count: {
          select: {
            applications: true,
            events: true,
          },
        },
      },
    });

    if (!opportunity) {
      res.status(404).json({ error: 'Opportunity not found' });
      return;
    }

    const applicationStats = await prisma.application.groupBy({
      by: ['status'],
      where: { opportunityId: req.params.id },
      _count: true,
    });

    res.status(200).json({ ...opportunity, applicationStats });
  } catch (err) {
    next(err);
  }
}
