import { prisma } from '../../lib/prisma';

export async function listBadges() {
  return prisma.badge.findMany({ orderBy: { name: 'asc' } });
}

export async function getMyBadges(userId: string) {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  });

  const allBadges = await prisma.badge.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, title: true, description: true, imageUrl: true, criteria: true },
  });

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
  const result = allBadges.map((badge) => ({
    ...badge,
    earned: earnedBadgeIds.has(badge.id),
    earnedAt: userBadges.find((ub) => ub.badgeId === badge.id)?.earnedAt ?? null,
  }));

  return result;
}
