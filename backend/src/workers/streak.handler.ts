import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';

export async function updateStreaks() {
  logger.info('[Streak] Starting daily streak update');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let updated = 0;
  let reset = 0;
  let cursor: string | undefined;
  const PAGE_SIZE = 500;

  while (true) {
    const profiles = await prisma.volunteerProfile.findMany({
      where: {
        OR: [
          { lastActiveAt: { gte: yesterday } },
          { currentStreak: { gt: 0 } },
        ],
      },
      select: { userId: true, currentStreak: true, longestStreak: true, lastActiveAt: true },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { userId: cursor } } : {}),
      orderBy: { userId: 'asc' },
    });

    if (profiles.length === 0) break;

    cursor = profiles[profiles.length - 1].userId;

    const BATCH_SIZE = 100;
    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      const batch = profiles.slice(i, i + BATCH_SIZE);
      const ops = [];

      for (const profile of batch) {
        const wasActiveYesterday =
          profile.lastActiveAt &&
          profile.lastActiveAt >= yesterday &&
          profile.lastActiveAt < todayStart;

        if (wasActiveYesterday) {
          const newStreak = profile.currentStreak + 1;
          const newLongest = Math.max(newStreak, profile.longestStreak);
          ops.push(
            prisma.volunteerProfile.update({
              where: { userId: profile.userId },
              data: { currentStreak: newStreak, longestStreak: newLongest },
            })
          );
          updated++;
        } else if (profile.lastActiveAt && profile.lastActiveAt < yesterday) {
          ops.push(
            prisma.volunteerProfile.update({
              where: { userId: profile.userId },
              data: { currentStreak: 0 },
            })
          );
          reset++;
        }
      }

      if (ops.length > 0) {
        await prisma.$transaction(ops);
      }
    }
  }

  logger.info(`[Streak] Updated ${updated} streaks, reset ${reset} streaks`);
}

export async function updateLastActive(userId: string) {
  await prisma.volunteerProfile
    .updateMany({
      where: { userId },
      data: { lastActiveAt: new Date() },
    })
    .catch((err) => {
      logger.warn(`[Streak] Failed to update lastActive for user ${userId}`, { error: err });
    });
}
