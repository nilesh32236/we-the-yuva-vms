import { prisma } from '../../lib/prisma';

export async function listBadges() {
  return prisma.badge.findMany({ orderBy: { name: 'asc' } });
}

export async function getMyBadges(userId: string) {
  const [userBadges, allBadges] = await Promise.all([
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.badge.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        imageUrl: true,
        criteria: true,
      },
    }),
  ]);

  const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));
  const result = allBadges.map((badge) => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earnedAt: earnedMap.get(badge.id) ?? null,
  }));

  return result;
}
