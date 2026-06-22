import { prisma } from '../../lib/prisma';
import type { InitialAssessmentInput, ReflectionInput } from '../../shared/schemas/youth.schemas';

export async function getYouthProfile(userId: string) {
  return prisma.youthProfile.findUnique({ where: { userId } });
}

export async function submitInitialAssessment(userId: string, data: InitialAssessmentInput) {
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
