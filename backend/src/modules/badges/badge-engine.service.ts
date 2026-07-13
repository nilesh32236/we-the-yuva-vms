import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { invalidateCache } from '../leaderboard/leaderboard.service';

type BadgeCriteria =
  | { type: 'ONBOARDING_COMPLETE' }
  | { type: 'EVENTS_ATTENDED'; count: number }
  | { type: 'HOURS_LOGGED'; count: number }
  | { type: 'REFERRALS'; count: number }
  | { type: 'GRIEVANCES_RESOLVED'; count: number }
  | { type: 'MENTEES'; count: number }
  | { type: 'LEVEL_2_IN_30_DAYS' }
  | { type: 'STREAK'; count: number }
  | { type: 'STORIES_PUBLISHED'; count: number }
  | { type: 'EVENTS_AFTER_HOURS'; count: number }
  | { type: 'FIRST_EVENT' }
  | { type: 'INDUCTION'; eventsCount: number; hoursCount: number }
  | { type: 'MOBILIZER'; eventsCount: number; hoursCount: number; referralsCount: number }
  | { type: 'LEADER'; eventsCount: number; hoursCount: number; menteesCount: number };

export async function awardPoints(
  userId: string,
  amount: number,
  reason: string,
  reference?: string
) {
  await prisma.$transaction([
    prisma.pointTransaction.create({
      data: { userId, amount, reason, reference },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { points: { increment: amount } },
    }),
  ]);
  invalidateCache();
}

interface BatchData {
  profile: { bio: string | null; totalHours: number; currentStreak: number } | null;
  attendanceCount: number;
  referralCount: number;
  menteeCount: number;
  storyPublishedCount: number;
  user: { createdAt: Date; currentLevel: { tier: number } | null } | null;
  courseProgressCount: number;
  afterHoursCount: number;
}

async function getBatchData(userId: string): Promise<BatchData> {
  const [profile, attendanceCount, referralCount, menteeCount, storyPublishedCount, user, courseProgressCount] =
    await Promise.all([
      prisma.volunteerProfile.findUnique({
        where: { userId },
        select: { bio: true, totalHours: true, currentStreak: true },
      }),
      prisma.attendance.count({ where: { volunteerId: userId, attended: true } }),
      prisma.user.count({ where: { referredById: userId } }),
      prisma.mentorship.count({ where: { mentorId: userId, status: 'ACTIVE' } }),
      prisma.story.count({ where: { userId, published: true } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true, currentLevel: { select: { tier: true } } },
      }),
      prisma.courseProgress.count({
        where: { userId, completed: true, course: { category: 'ORIENTATION' } },
      }),
    ]);

  const afterHoursCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM "Attendance" a
    JOIN "Event" e ON a."eventId" = e.id
    WHERE a."volunteerId" = ${userId} AND a.attended = true
    AND (EXTRACT(HOUR FROM e."startTime"::time) >= 17 OR EXTRACT(DOW FROM e."eventDate") IN (0, 6))
  `.then((r) => Number(r[0]?.count ?? 0));

  return { profile, attendanceCount, referralCount, menteeCount, storyPublishedCount, user, courseProgressCount, afterHoursCount };
}

export async function checkAndAwardBadges(userId: string) {
  const allBadges = await prisma.badge.findMany({
    select: { id: true, name: true, criteria: true, requiresApproval: true },
  });
  const earnedBadgeIds = new Set(
    (await prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } })).map(
      (b) => b.badgeId
    )
  );
  const pendingApprovalBadgeIds = new Set(
    (await prisma.badgeApproval.findMany({
      where: { userId, status: 'PENDING' },
      select: { badgeId: true },
    })).map((b) => b.badgeId)
  );

  const eligibleBadges = allBadges.filter((b) => !earnedBadgeIds.has(b.id) && !pendingApprovalBadgeIds.has(b.id));
  const batchData = await getBatchData(userId);
  const criteriaResults = eligibleBadges.map((badge) => evaluateCriteria(batchData, badge.criteria as BadgeCriteria));

  const awardOps: Promise<unknown>[] = [];
  for (let i = 0; i < eligibleBadges.length; i++) {
    if (criteriaResults[i]) {
      const badge = eligibleBadges[i];
      const op = (async () => {
        if (badge.requiresApproval) {
          await prisma.badgeApproval.upsert({
            where: { userId_badgeId: { userId, badgeId: badge.id } },
            update: { status: 'PENDING', reviewedAt: null, reviewedBy: null, reviewNote: null },
            create: { userId, badgeId: badge.id },
          });
        } else {
          await prisma.$transaction([
            prisma.userBadge.create({
              data: { userId, badgeId: badge.id },
            }),
            prisma.pointTransaction.create({
              data: { userId, amount: 50, reason: `BADGE_${badge.name}`, reference: badge.id },
            }),
            prisma.user.update({
              where: { id: userId },
              data: { points: { increment: 50 } },
            }),
          ]);
          if (notificationsQueue) {
            await notificationsQueue
              .add('badge-earned', { userId, badgeName: badge.name })
              .catch((err) => logger.warn('Badge notification failed', { error: (err as Error).message }));
          }
        }
      })();
      awardOps.push(op);
    }
  }
  const settled = await Promise.allSettled(awardOps);
  for (const result of settled) {
    if (result.status === 'rejected') {
      logger.warn('Badge award operation failed', { error: (result.reason as Error)?.message });
    }
  }

  return eligibleBadges.filter((_, i) => criteriaResults[i]);
}

async function evaluateCriteria(data: BatchData, criteria: BadgeCriteria): Promise<boolean> {
  switch (criteria.type) {
    case 'ONBOARDING_COMPLETE': {
      return !!data.profile && data.profile.bio !== null && data.courseProgressCount >= 1;
    }

    case 'EVENTS_ATTENDED': {
      return data.attendanceCount >= (criteria.count ?? 1);
    }

    case 'HOURS_LOGGED': {
      return (data.profile?.totalHours ?? 0) >= (criteria.count ?? 100);
    }

    case 'REFERRALS': {
      return data.referralCount >= (criteria.count ?? 3);
    }

    case 'GRIEVANCES_RESOLVED': {
      return false;
    }

    case 'MENTEES': {
      return data.menteeCount >= (criteria.count ?? 5);
    }

    case 'LEVEL_2_IN_30_DAYS': {
      if (!data.user?.currentLevel || data.user.currentLevel.tier < 2) return false;
      const daysSinceSignup = Math.floor(
        (Date.now() - data.user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceSignup <= 30;
    }

    case 'STREAK': {
      return (data.profile?.currentStreak ?? 0) >= (criteria.count ?? 30);
    }

    case 'STORIES_PUBLISHED': {
      return data.storyPublishedCount >= (criteria.count ?? 5);
    }

    case 'EVENTS_AFTER_HOURS': {
      return data.afterHoursCount >= (criteria.count ?? 3);
    }

    case 'FIRST_EVENT': {
      return data.attendanceCount >= 1;
    }

    case 'INDUCTION': {
      return data.attendanceCount >= criteria.eventsCount && (data.profile?.totalHours ?? 0) >= criteria.hoursCount;
    }

    case 'MOBILIZER': {
      return data.attendanceCount >= criteria.eventsCount && (data.profile?.totalHours ?? 0) >= criteria.hoursCount && data.referralCount >= criteria.referralsCount;
    }

    case 'LEADER': {
      return data.attendanceCount >= criteria.eventsCount && (data.profile?.totalHours ?? 0) >= criteria.hoursCount && data.menteeCount >= criteria.menteesCount;
    }

    default:
      return false;
  }
}

export async function onEventCheckIn(userId: string, eventId: string) {
  await awardPoints(userId, 10, 'EVENT_CHECKIN', eventId);
  try {
    await checkAndAwardBadges(userId);
  } catch (err) {
    logger.warn('Badge evaluation failed on event check-in', { userId, error: (err as Error).message });
  }
}

export async function onEventCheckOut(userId: string, eventId: string, hours: number) {
  const points = Math.round(hours * 5);
  if (points > 0) {
    await awardPoints(userId, points, 'EVENT_HOURS', eventId);
  }
  try {
    await checkAndAwardBadges(userId);
  } catch (err) {
    logger.warn('Badge evaluation failed on event check-out', { userId, error: (err as Error).message });
  }
}

export async function onFeedbackSubmitted(userId: string, eventId: string) {
  await awardPoints(userId, 15, 'FEEDBACK_SUBMITTED', eventId);
  try {
    await checkAndAwardBadges(userId);
  } catch (err) {
    logger.warn('Badge evaluation failed on feedback submission', { userId, error: (err as Error).message });
  }
}

export async function onApplicationAccepted(userId: string, opportunityId: string) {
  await awardPoints(userId, 20, 'OPPORTUNITY_ACCEPTED', opportunityId);
  try {
    await checkAndAwardBadges(userId);
  } catch (err) {
    logger.warn('Badge evaluation failed on application accepted', { userId, error: (err as Error).message });
  }
}
