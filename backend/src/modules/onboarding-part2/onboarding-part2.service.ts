import { AppError } from '@/middleware/error.middleware';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import type { Part2Data } from '@/shared/schemas/part2.schemas';

export async function getPart2(userId: string, userRole: string) {
  if (userRole !== 'VOLUNTEER') {
    throw new AppError('Only volunteers can access Part II onboarding', 403);
  }

  const challenge = await prisma.kindnessChallenge.findUnique({ where: { userId } });
  const unlocked = !!challenge?.part2UnlockedAt;
  if (!unlocked) {
    return { unlocked: false as const, data: null };
  }

  const data = await prisma.volunteerOnboardingPart2.findUnique({ where: { userId } });
  return { unlocked: true as const, data };
}

export async function upsertPart2(userId: string, userRole: string, input: Part2Data) {
  if (userRole !== 'VOLUNTEER') {
    throw new AppError('Only volunteers can submit Part II onboarding', 403);
  }

  const challenge = await prisma.kindnessChallenge.findUnique({ where: { userId } });
  if (!challenge?.part2UnlockedAt) {
    throw new AppError('Part II is locked — complete the Kindness Challenge first', 403);
  }

  const now = new Date();
  const data = await prisma.volunteerOnboardingPart2.upsert({
    where: { userId },
    create: {
      userId,
      ...input,
      completedAt: now,
    },
    update: {
      ...input,
      completedAt: now,
    },
  });
  logAudit({
    userId,
    action: 'USER_UPDATE',
    targetId: userId,
    targetType: 'VolunteerOnboardingPart2',
    metadata: { volunteerRoleTier: String(input.volunteerRoleTier) },
  }).catch(() => {});
  return data;
}
