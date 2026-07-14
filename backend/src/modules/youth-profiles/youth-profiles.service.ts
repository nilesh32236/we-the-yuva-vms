import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import type { InitialAssessmentInput, ReflectionInput } from '../../shared/schemas/youth.schemas';

export async function getYouthProfile(userId: string) {
  return prisma.youthProfile.findUnique({ where: { userId } });
}

async function ensureUserExists(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new AppError('User not found', 404);
}

export async function submitInitialAssessment(userId: string, data: InitialAssessmentInput) {
  await ensureUserExists(userId);
  return prisma.youthProfile.upsert({
    where: { userId },
    create: {
      userId,
      initialResponses: data,
      initialCompletedAt: new Date(),
    },
    update: {
      initialResponses: data,
      initialCompletedAt: new Date(),
    },
  });
}

export async function submitReflection(userId: string, data: ReflectionInput) {
  await ensureUserExists(userId);
  return prisma.youthProfile.upsert({
    where: { userId },
    create: {
      userId,
      reflectionResponses: data,
      reflectionCompletedAt: new Date(),
    },
    update: {
      reflectionResponses: data,
      reflectionCompletedAt: new Date(),
    },
  });
}
