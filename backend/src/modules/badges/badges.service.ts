import { AppError } from '../../middleware/error.middleware';
import { prisma } from '../../lib/prisma';
import { awardPoints } from './badge-engine.service';

export async function listBadges() {
  return prisma.badge.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      title: true,
      description: true,
      imageUrl: true,
      criteria: true,
      requiresApproval: true,
    },
  });
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
  const pendingBadgeIds = new Set(
    (await prisma.badgeApproval.findMany({
      where: { userId, status: 'PENDING' },
      select: { badgeId: true },
    })).map((b) => b.badgeId)
  );

  const result = allBadges.map((badge) => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earnedAt: earnedMap.get(badge.id) ?? null,
    pending: pendingBadgeIds.has(badge.id),
  }));

  return result;
}

export async function listPendingApprovals() {
  return prisma.badgeApproval.findMany({
    where: { status: 'PENDING' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      badge: { select: { id: true, name: true, title: true, description: true, imageUrl: true } },
    },
    orderBy: { requestedAt: 'asc' },
  });
}

export async function approveBadge(userId: string, badgeId: string, reviewedBy: string, reviewNote?: string) {
  return prisma.$transaction(async () => {
    const existing = await prisma.badgeApproval.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });
    if (!existing) throw new AppError('Approval request not found', 404);
    if (existing.status !== 'PENDING') throw new AppError('Approval request is not pending', 400);

    const approval = await prisma.badgeApproval.update({
      where: { userId_badgeId: { userId, badgeId } },
      data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy, reviewNote },
    });

    await prisma.userBadge.create({
      data: { userId, badgeId },
    });

    await awardPoints(userId, 50, `BADGE_APPROVED_${badgeId}`, badgeId);

    return approval;
  });
}

export async function rejectBadge(userId: string, badgeId: string, reviewedBy: string, reviewNote?: string) {
  const existing = await prisma.badgeApproval.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });
  if (!existing) throw new AppError('Approval request not found', 404);

  return prisma.badgeApproval.update({
    where: { userId_badgeId: { userId, badgeId } },
    data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy, reviewNote },
  });
}
