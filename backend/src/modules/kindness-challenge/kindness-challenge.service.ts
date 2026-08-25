import { type ChallengeStatus, type KindnessChallenge } from '@prisma/client';
import { AppError } from '@/middleware/error.middleware';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { istDayNumber } from '@/modules/kindness-challenge/date.utils';

const CHALLENGE_DAYS = 7;
const SHARE_NUDGE_WINDOW_DAYS = 30;
const MAX_START_DAYS_AHEAD = 90;

type ChallengeWithRelations = KindnessChallenge & {
  checkIns: Array<{ day: number }>;
  storyId: string | null;
};

function computeView(challenge: ChallengeWithRelations, now: Date) {
  const currentDay = istDayNumber(challenge.startDate, now);
  const checkedInDays = challenge.checkIns.map((c) => c.day).sort((a, b) => a - b);
  const isActive = challenge.status === 'ACTIVE';
  return {
    currentDay,
    checkedInDays,
    canCheckInToday: isActive && currentDay >= 1 && currentDay <= CHALLENGE_DAYS && !checkedInDays.includes(currentDay),
    canShareStory: isActive && currentDay >= CHALLENGE_DAYS,
    daysRemaining: Math.max(0, CHALLENGE_DAYS - currentDay),
  };
}

async function getOwnedChallenge(userId: string): Promise<ChallengeWithRelations> {
  const challenge = await prisma.kindnessChallenge.findUnique({
    where: { userId },
    include: { checkIns: { select: { day: true } } },
  });
  if (!challenge) throw new AppError('You have not started the Kindness Challenge yet', 404);
  return challenge as ChallengeWithRelations;
}

export async function startChallenge(
  userId: string,
  input: { acts: string[]; startDate: Date },
  now: Date = new Date()
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileComplete: true },
  });
  if (!user?.profileComplete) {
    throw new AppError('Complete your registration before starting the challenge', 403);
  }

  const existing = await prisma.kindnessChallenge.findUnique({ where: { userId } });
  if (existing) throw new AppError('You have already started the Kindness Challenge', 409);

  // daysAhead = IST calendar days from now to startDate
  const daysAhead = 1 - istDayNumber(input.startDate, now);
  if (daysAhead < 0) throw new AppError('Start date cannot be in the past', 422);
  if (daysAhead > MAX_START_DAYS_AHEAD) throw new AppError('Start date is too far in the future', 422);

  const startDate = new Date(input.startDate.getTime());
  const endDate = new Date(startDate.getTime() + CHALLENGE_DAYS * 86_400_000);
  try {
    return await prisma.kindnessChallenge.create({
      data: { userId, acts: input.acts, startDate, endDate, status: 'ACTIVE' },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'P2002') throw new AppError('You have already started the Kindness Challenge', 409);
    throw err;
  }
}

export async function getMyChallenge(userId: string, now: Date = new Date()) {
  const challenge = await prisma.kindnessChallenge.findUnique({
    where: { userId },
    include: { checkIns: { orderBy: { day: 'asc' } }, story: { select: { id: true, title: true } } },
  });
  if (!challenge) return null;
  return { challenge, view: computeView(challenge as ChallengeWithRelations, now) };
}

export async function checkIn(userId: string, now: Date = new Date()) {
  const challenge = await getOwnedChallenge(userId);
  if (challenge.status !== 'ACTIVE') throw new AppError('Challenge is already completed', 409);

  const day = istDayNumber(challenge.startDate, now);
  if (day < 1 || day > CHALLENGE_DAYS) throw new AppError('No check-in available today', 422);
  if (challenge.checkIns.some((c) => c.day === day)) {
    throw new AppError('Already checked in today', 409);
  }

  try {
    return await prisma.kindnessChallenge.update({
      where: { id: challenge.id },
      data: { checkIns: { create: [{ day }] } },
      include: { checkIns: { orderBy: { day: 'asc' } } },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'P2002') throw new AppError('Already checked in today', 409);
    throw err;
  }
}

async function completeChallenge(id: string, storyId: string, now: Date) {
  const result = await prisma.kindnessChallenge.updateMany({
    where: { id, status: 'ACTIVE', storyId: null },
    data: { storyId, status: 'COMPLETED' as ChallengeStatus, completedAt: now, part2UnlockedAt: now },
  });
  if (result.count !== 1) throw new AppError('Challenge is already completed', 409);
  return prisma.kindnessChallenge.findUniqueOrThrow({ where: { id } });
}

export async function completeWithStory(challengeId: string, userId: string, storyId: string, now: Date = new Date()) {
  const challenge = await prisma.kindnessChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.userId !== userId) {
    throw new AppError('Challenge not found', 404);
  }
  if (challenge.status !== 'ACTIVE') throw new AppError('Challenge is already completed', 409);
  if (istDayNumber(challenge.startDate, now) < CHALLENGE_DAYS) {
    throw new AppError('Come back on Day 7 to share your story', 422);
  }
  return completeChallenge(challenge.id, storyId, now);
}

export async function linkExistingStory(userId: string, storyId: string, now: Date = new Date()) {
  const challenge = await getOwnedChallenge(userId);
  if (challenge.status !== 'ACTIVE') throw new AppError('Challenge is already completed', 409);
  if (istDayNumber(challenge.startDate, now) < CHALLENGE_DAYS) {
    throw new AppError('Stories can be linked from Day 7 onwards', 422);
  }
  const story = await prisma.story.findFirst({ where: { id: storyId, userId } });
  if (!story) throw new AppError('Story not found', 404);
  try {
    return await completeChallenge(challenge.id, storyId, now);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'P2002') {
      logger.warn('Story link failed', { userId, storyId, error: (err as Error).message });
      throw new AppError('That story is already linked to a challenge', 409);
    }
    throw err;
  }
}

/** Cohort selection for the daily reminder job (Task 8). */
export async function getReminderTargets(now: Date = new Date()) {
  const challenges = await prisma.kindnessChallenge.findMany({
    where: { status: 'ACTIVE' },
    select: { userId: true, startDate: true, storyId: true, checkIns: { select: { day: true } } },
  });

  const targets: Array<{ userId: string; kind: 'CHECKIN' | 'SHARE'; day: number }> = [];
  for (const c of challenges) {
    const day = istDayNumber(c.startDate, now);
    if (day >= 1 && day <= CHALLENGE_DAYS && !c.checkIns.some((ci) => ci.day === day)) {
      targets.push({ userId: c.userId, kind: 'CHECKIN', day });
    } else if (day > CHALLENGE_DAYS && day <= CHALLENGE_DAYS + SHARE_NUDGE_WINDOW_DAYS && !c.storyId) {
      targets.push({ userId: c.userId, kind: 'SHARE', day });
    }
  }
  return targets;
}

export async function listChallengesForAdmin(filters: { status?: 'ACTIVE' | 'COMPLETED'; source?: string }) {
  return prisma.kindnessChallenge.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.source ? { user: { referralSource: filters.source as never } } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          whatsappNumber: true,
          referralSource: true,
          createdAt: true,
          part2: { select: { volunteerRoleTier: true, lifeSkills: true, completedAt: true } },
        },
      },
      story: { select: { id: true, title: true } },
      checkIns: { select: { day: true }, orderBy: { day: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  }) as Promise<Array<ChallengeWithRelations & {
    user: { id: string; name: string; email: string | null; phone: string | null; whatsappNumber: string | null; referralSource: string | null; createdAt: Date; part2: { volunteerRoleTier: string | null; lifeSkills: string[]; completedAt: Date | null } | null };
    story: { id: string; title: string } | null;
  }>>;
}
