import type { Prisma } from '@prisma/client';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { AppError } from '../../middleware/error.middleware';
import { generateCertificate } from '../certificates/certificates.service';
import { checkAndAwardBadges } from '../badges/badge-engine.service';

export async function listLevels() {
  return prisma.level.findMany({ orderBy: { tier: 'asc' } });
}

export async function getLevel(id: string) {
  const level = await prisma.level.findUnique({ where: { id } });
  if (!level) throw new AppError('Level not found', 404);
  return level;
}

export async function getMyLevel(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      points: true,
      currentLevelId: true,
      currentLevel: true,
      profile: { select: { currentStreak: true, longestStreak: true, totalHours: true } },
    },
  });
  if (!user) throw new AppError('User not found', 404);

  const allLevels = await prisma.level.findMany({ orderBy: { tier: 'asc' } });

  return {
    currentLevel: user.currentLevel,
    points: user.points,
    streak: user.profile?.currentStreak ?? 0,
    longestStreak: user.profile?.longestStreak ?? 0,
    totalHours: user.profile?.totalHours ?? 0,
    allLevels,
  };
}

export async function getMyProgress(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentLevelId: true, points: true, profile: true },
  });
  if (!user) throw new AppError('User not found', 404);

  const allLevels = await prisma.level.findMany({ orderBy: { tier: 'asc' } });
  const currentTier = user.currentLevelId
    ? allLevels.find((l) => l.id === user.currentLevelId)
    : null;
  const nextLevel = currentTier
    ? allLevels.find((l) => l.tier === currentTier.tier + 1)
    : allLevels[0];

  const eventsAttended = await prisma.attendance.count({
    where: { volunteerId: userId, attended: true },
  });
  const storiesPublished = await prisma.story.count({
    where: { userId, published: true },
  });
  const totalHours = user.profile?.totalHours ?? 0;

  return {
    currentLevel: currentTier,
    nextLevel,
    points: user.points,
    stats: {
      eventsAttended,
      storiesPublished,
      totalHours,
      referrals: 0,
      grievancesResolved: 0,
      mentored: 0,
    },
  };
}

export async function getMyLevelRequests(userId: string) {
  return prisma.userLevel.findMany({
    where: { userId },
    include: { level: true, reviewer: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createLevelRequest(
  userId: string,
  levelId: string,
  data: {
    proofUrls?: string[];
    videoUrl?: string;
    proofData?: Record<string, unknown>;
    notes?: string;
    peerEndorsements?: Record<string, unknown>;
  }
) {
  const level = await prisma.level.findUnique({ where: { id: levelId } });
  if (!level) throw new AppError('Level not found', 404);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) throw new AppError('User not found', 404);

  const existing = await prisma.userLevel.findFirst({
    where: { userId, levelId, status: 'PENDING' },
  });
  if (existing) throw new AppError('You already have a pending request for this level', 400);

  const isAutoApproved = await checkAutoPromotion(userId, level);

  const result = await prisma.userLevel.create({
    data: {
      userId,
      levelId,
      status: isAutoApproved ? 'AUTO_APPROVED' : 'PENDING',
      proofUrls: data.proofUrls ?? [],
      videoUrl: data.videoUrl,
      proofData: data.proofData as Prisma.InputJsonValue,
      notes: data.notes,
      peerEndorsements: data.peerEndorsements as Prisma.InputJsonValue,
      approvedAt: isAutoApproved ? new Date() : null,
    },
    include: { level: true },
  });

  if (isAutoApproved) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { currentLevelId: level.id },
      });
      await tx.pointTransaction.create({
        data: { userId, amount: 100, reason: 'LEVEL_UP', reference: level.id },
      });
      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: 100 } },
      });
    });
    try {
      const _cert = await generateCertificate(userId, level.id);
    } catch (err) {
      logger.warn('Failed to generate certificate on level approval', {
        err,
        userId,
        levelId: level.id,
      });
    }
    try {
      await checkAndAwardBadges(userId);
    } catch (err) {
      logger.warn('Failed to check and award badges on auto-promotion', { err, userId });
    }
    if (notificationsQueue) {
      await notificationsQueue
        .add('level-up', { userId, levelName: level.name })
        .catch(() => {});
    }
  }

  return result;
}

async function checkAutoPromotion(userId: string, level: { tier: number }): Promise<boolean> {
  if (level.tier === 0) {
    const [courseProgress, eventAttendance] = await Promise.all([
      prisma.courseProgress.count({ where: { userId, completed: true } }),
      prisma.attendance.count({ where: { volunteerId: userId, attended: true } }),
    ]);
    return courseProgress >= 1 && eventAttendance >= 1;
  }

  if (level.tier === 1) {
    const eventsAttended = await prisma.attendance.count({
      where: { volunteerId: userId, attended: true },
    });
    return eventsAttended >= 5;
  }

  if (level.tier === 2) {
    return false;
  }

  return false;
}

export async function cancelLevelRequest(requestId: string, userId: string) {
  const request = await prisma.userLevel.findUnique({ where: { id: requestId } });
  if (!request || request.userId !== userId) throw new AppError('Request not found', 404);
  if (request.status !== 'PENDING') throw new AppError('Can only cancel pending requests', 400);
  return prisma.userLevel.delete({ where: { id: requestId } });
}

export async function listPendingRequests(search?: string) {
  const where = search
    ? {
        status: 'PENDING' as const,
        user: { name: { contains: search, mode: 'insensitive' as const } },
      }
    : { status: 'PENDING' as const };
  return prisma.userLevel.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, currentLevel: true } },
      level: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function reviewLevelRequest(
  requestId: string,
  reviewerId: string,
  data: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string }
) {
  const request = await prisma.userLevel.findUnique({
    where: { id: requestId },
    include: { level: true },
  });
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'PENDING') throw new AppError('Request already reviewed', 400);

  const updateData: Prisma.UserLevelUpdateInput = {
    status: data.status,
    reviewerId,
    reviewNote: data.reviewNote,
    reviewedAt: new Date(),
  };

  if (data.status === 'APPROVED') {
    updateData.approvedAt = new Date();
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.userLevel.update({
      where: { id: requestId },
      data: updateData,
      include: { level: true, user: { select: { id: true, name: true, email: true } } },
    });

    if (data.status === 'APPROVED') {
      await tx.user.update({
        where: { id: request.userId },
        data: { currentLevelId: request.levelId },
      });

      await tx.pointTransaction.create({
        data: {
          userId: request.userId,
          amount: 100,
          reason: 'LEVEL_UP',
          reference: requestId,
        },
      });

      await tx.user.update({
        where: { id: request.userId },
        data: { points: { increment: 100 } },
      });
    }

    return updated;
  });

  if (data.status === 'APPROVED') {
    try {
      const _cert = await generateCertificate(request.userId, request.levelId);
    } catch (err) {
      logger.warn('Failed to generate certificate on level approval', {
        err,
        userId: request.userId,
        levelId: request.levelId,
      });
    }
    try {
      await checkAndAwardBadges(request.userId);
    } catch (err) {
      logger.warn('Failed to check and award badges on level approval', {
        err,
        userId: request.userId,
      });
    }
    if (notificationsQueue) {
      await notificationsQueue
        .add('level-up', { userId: request.userId, levelName: request.level.name })
        .catch(() => {});
    }
  }

  return result;
}

export async function getMyPoints(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });
  if (!user) throw new AppError('User not found', 404);

  const totalEarned = await prisma.pointTransaction.aggregate({
    where: { userId, amount: { gt: 0 } },
    _sum: { amount: true },
  });

  return {
    currentPoints: user.points,
    totalEarned: totalEarned._sum.amount ?? 0,
  };
}

export async function getMyPointsHistory(userId: string) {
  return prisma.pointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
