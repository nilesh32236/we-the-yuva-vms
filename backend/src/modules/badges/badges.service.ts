import { prisma } from '../../lib/prisma';
import { awardPoints } from './badge-engine.service';

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
    select: {
      id: true,
      name: true,
      title: true,
      description: true,
      imageUrl: true,
      criteria: true,
    },
  });

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
  const pendingBadgeIds = new Set(
    (await prisma.badgeApproval.findMany({
      where: { userId, status: 'PENDING' },
      select: { badgeId: true },
    })).map((b) => b.badgeId)
  );

  const result = allBadges.map((badge) => ({
    ...badge,
    earned: earnedBadgeIds.has(badge.id),
    earnedAt: userBadges.find((ub) => ub.badgeId === badge.id)?.earnedAt ?? null,
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
  const approval = await prisma.badgeApproval.update({
    where: { userId_badgeId: { userId, badgeId } },
    data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy, reviewNote },
  });

  await prisma.userBadge.create({
    data: { userId, badgeId },
  });

  await awardPoints(userId, 50, `BADGE_APPROVED_${badgeId}`, badgeId);

  return approval;
}

export async function rejectBadge(userId: string, badgeId: string, reviewedBy: string, reviewNote?: string) {
  return prisma.badgeApproval.update({
    where: { userId_badgeId: { userId, badgeId } },
    data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy, reviewNote },
  });
}
