import { prisma } from '../../lib/prisma';

export async function listEvents(page: number, limit: number) {
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

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getEvent(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      opportunity: {
        select: {
          title: true,
          organization: { select: { name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      },
      _count: { select: { attendances: true } },
    },
  });

  return event;
}
