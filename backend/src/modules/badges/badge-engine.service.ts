import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';

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
  | { type: 'EVENTS_AFTER_HOURS'; count: number };

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
}

export async function checkAndAwardBadges(userId: string) {
  const allBadges = await prisma.badge.findMany();
  const earnedBadgeIds = new Set(
    (await prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } })).map(
      (b) => b.badgeId
    )
  );

  const eligibleBadges = allBadges.filter((b) => !earnedBadgeIds.has(b.id));
  const criteriaResults = await Promise.all(
    eligibleBadges.map((badge) => evaluateCriteria(userId, badge.criteria as BadgeCriteria))
  );

  const awardOps: Promise<unknown>[] = [];
  for (let i = 0; i < eligibleBadges.length; i++) {
    if (criteriaResults[i]) {
      const badge = eligibleBadges[i];
      const op = (async () => {
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
      })();
      awardOps.push(op);
    }
  }
  await Promise.all(awardOps);

  return eligibleBadges.filter((_, i) => criteriaResults[i]);
}

async function evaluateCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
  switch (criteria.type) {
    case 'ONBOARDING_COMPLETE': {
      const [profile, courseProgress] = await Promise.all([
        prisma.volunteerProfile.findUnique({ where: { userId } }),
        prisma.courseProgress.count({
          where: { userId, completed: true, course: { category: 'ORIENTATION' } },
        }),
      ]);
      return !!profile && profile.bio !== null && courseProgress >= 1;
    }

    case 'EVENTS_ATTENDED': {
      const count = await prisma.attendance.count({
        where: { volunteerId: userId, attended: true },
      });
      return count >= (criteria.count ?? 1);
    }

    case 'HOURS_LOGGED': {
      const profile = await prisma.volunteerProfile.findUnique({
        where: { userId },
        select: { totalHours: true },
      });
      return (profile?.totalHours ?? 0) >= (criteria.count ?? 100);
    }

    case 'REFERRALS': {
      return false;
    }

    case 'GRIEVANCES_RESOLVED': {
      return false;
    }

    case 'MENTEES': {
      const count = await prisma.mentorship.count({
        where: { mentorId: userId, status: 'ACTIVE' },
      });
      return count >= (criteria.count ?? 5);
    }

    case 'LEVEL_2_IN_30_DAYS': {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true, currentLevel: { select: { tier: true } } },
      });
      if (!user?.currentLevel || user.currentLevel.tier < 2) return false;
      const daysSinceSignup = Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceSignup <= 30;
    }

    case 'STREAK': {
      const profile = await prisma.volunteerProfile.findUnique({
        where: { userId },
        select: { currentStreak: true },
      });
      return (profile?.currentStreak ?? 0) >= (criteria.count ?? 30);
    }

    case 'STORIES_PUBLISHED': {
      const count = await prisma.story.count({
        where: { userId, published: true },
      });
      return count >= (criteria.count ?? 5);
    }

    case 'EVENTS_AFTER_HOURS': {
      const attendances = await prisma.attendance.findMany({
        where: { volunteerId: userId, attended: true },
        select: {
          event: { select: { startTime: true, eventDate: true } },
        },
      });
      const eveningWeekendCount = attendances.filter((a) => {
        if (!a.event.startTime) return false;
        const hour = Number.parseInt(a.event.startTime.split(':')[0] ?? '0', 10);
        const day = a.event.eventDate.getDay();
        return hour >= 17 || day === 0 || day === 6;
      }).length;
      return eveningWeekendCount >= (criteria.count ?? 3);
    }

    default:
      return false;
  }
}

export async function onEventCheckIn(userId: string, eventId: string) {
  await awardPoints(userId, 10, 'EVENT_CHECKIN', eventId);
  await checkAndAwardBadges(userId);
}

export async function onEventCheckOut(userId: string, eventId: string, hours: number) {
  const points = Math.round(hours * 5);
  if (points > 0) {
    await awardPoints(userId, points, 'EVENT_HOURS', eventId);
  }
  await checkAndAwardBadges(userId);
}

export async function onFeedbackSubmitted(userId: string, eventId: string) {
  await awardPoints(userId, 15, 'FEEDBACK_SUBMITTED', eventId);
  await checkAndAwardBadges(userId);
}

export async function onApplicationAccepted(userId: string, opportunityId: string) {
  await awardPoints(userId, 20, 'OPPORTUNITY_ACCEPTED', opportunityId);
  await checkAndAwardBadges(userId);
}
