import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';

export async function updateStreaks() {
  logger.info('[Streak] Starting daily streak update');

  const profiles = await prisma.volunteerProfile.findMany({
    select: { userId: true, currentStreak: true, longestStreak: true, lastActiveAt: true },
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let updated = 0;
  let reset = 0;

  for (const profile of profiles) {
    const wasActiveYesterday =
      profile.lastActiveAt && profile.lastActiveAt >= yesterday && profile.lastActiveAt < todayStart;

    if (wasActiveYesterday) {
      const newStreak = profile.currentStreak + 1;
      const newLongest = Math.max(newStreak, profile.longestStreak);

      await prisma.volunteerProfile.update({
        where: { userId: profile.userId },
        data: { currentStreak: newStreak, longestStreak: newLongest },
      });
      updated++;
    } else if (profile.lastActiveAt && profile.lastActiveAt < yesterday) {
      await prisma.volunteerProfile.update({
        where: { userId: profile.userId },
        data: { currentStreak: 0 },
      });
      reset++;
    }
  }

  logger.info(`[Streak] Updated ${updated} streaks, reset ${reset} streaks`);
}

export async function updateLastActive(userId: string) {
  await prisma.volunteerProfile.updateMany({
    where: { userId },
    data: { lastActiveAt: new Date() },
  }).catch(() => {});
}
