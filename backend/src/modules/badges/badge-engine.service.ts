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
}

export async function checkAndAwardBadges(userId: string) {
  const allBadges = await prisma.badge.findMany();
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

  const results: { badge: (typeof allBadges)[number]; newlyEarned: boolean }[] = [];

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id) || pendingApprovalBadgeIds.has(badge.id)) {
      results.push({ badge, newlyEarned: false });
      continue;
    }

    const criteria = badge.criteria as BadgeCriteria;
    const met = await evaluateCriteria(userId, criteria);

    if (met) {
      if (badge.requiresApproval) {
        await prisma.badgeApproval.upsert({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
          update: { status: 'PENDING', reviewedAt: null, reviewedBy: null, reviewNote: null },
          create: { userId, badgeId: badge.id },
        });
      } else {
        await prisma.userBadge.create({
          data: { userId, badgeId: badge.id },
        });
        await awardPoints(userId, 50, `BADGE_${badge.name}`, badge.id);
        if (notificationsQueue) {
          await notificationsQueue
            .add('badge-earned', { userId, badgeName: badge.name })
            .catch(() => {});
        }
      }
      results.push({ badge, newlyEarned: true });
    } else {
      results.push({ badge, newlyEarned: false });
    }
  }

  return results.filter((r) => r.newlyEarned);
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
      const count = await prisma.user.count({
        where: { referredById: userId },
      });
      return count >= (criteria.count ?? 3);
    }

    case 'GRIEVANCES_RESOLVED': {
      // TODO: Implement grievance resolution tracking
      // This criteria requires a Grievance model (report + resolution status).
      // Once that exists, query: prisma.grievance.count({ where: { reportedById: userId, status: 'RESOLVED' } })
      // and compare against criteria.count. For now this badge is unobtainable — fix when grievance system lands.
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
        include: { event: { select: { startTime: true, eventDate: true } } },
      });
      const eveningWeekendCount = attendances.filter((a) => {
        const hour = Number.parseInt(a.event.startTime.split(':')[0] ?? '0', 10);
        const day = a.event.eventDate.getDay();
        return hour >= 17 || day === 0 || day === 6;
      }).length;
      return eveningWeekendCount >= (criteria.count ?? 3);
    }

    case 'FIRST_EVENT': {
      const count = await prisma.attendance.count({
        where: { volunteerId: userId, attended: true },
      });
      return count >= 1;
    }

    case 'INDUCTION': {
      const [attendedCount, profile] = await Promise.all([
        prisma.attendance.count({ where: { volunteerId: userId, attended: true } }),
        prisma.volunteerProfile.findUnique({ where: { userId }, select: { totalHours: true } }),
      ]);
      return attendedCount >= criteria.eventsCount && (profile?.totalHours ?? 0) >= criteria.hoursCount;
    }

    case 'MOBILIZER': {
      const [attendedCount, profile, referralsCount] = await Promise.all([
        prisma.attendance.count({ where: { volunteerId: userId, attended: true } }),
        prisma.volunteerProfile.findUnique({ where: { userId }, select: { totalHours: true } }),
        prisma.user.count({ where: { referredById: userId } }),
      ]);
      return attendedCount >= criteria.eventsCount && (profile?.totalHours ?? 0) >= criteria.hoursCount && referralsCount >= criteria.referralsCount;
    }

    case 'LEADER': {
      const [attendedCount, profile, menteesCount] = await Promise.all([
        prisma.attendance.count({ where: { volunteerId: userId, attended: true } }),
        prisma.volunteerProfile.findUnique({ where: { userId }, select: { totalHours: true } }),
        prisma.mentorship.count({ where: { mentorId: userId, status: 'ACTIVE' } }),
      ]);
      return attendedCount >= criteria.eventsCount && (profile?.totalHours ?? 0) >= criteria.hoursCount && menteesCount >= criteria.menteesCount;
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
