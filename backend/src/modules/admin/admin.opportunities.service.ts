import { prisma } from '../../lib/prisma';

export async function listOpportunities(page: number, limit: number, search?: string) {
  const skip = (page - 1) * limit;

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

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getOpportunity(id: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      skills: true,
      category: true,
      locationId: true,
      isRemote: true,
      startDate: true,
      endDate: true,
      hoursPerSession: true,
      totalSlots: true,
      status: true,
      createdAt: true,
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

  return opportunity;
}

export async function getApplicationStats(opportunityId: string) {
  const stats = await prisma.application.groupBy({
    by: ['status'],
    where: { opportunityId },
    _count: true,
  });
  return stats;
}
