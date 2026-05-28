import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export async function getMySubscriptions(userId: string) {
  return prisma.alertSubscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function createSubscription(
  userId: string,
  data: { categories?: string[]; skills?: string[] }
) {
  return prisma.alertSubscription.create({
    data: { userId, categories: data.categories ?? [], skills: data.skills ?? [] },
  });
}

export async function updateSubscription(
  id: string,
  userId: string,
  data: { categories?: string[]; skills?: string[]; isActive?: boolean }
) {
  const sub = await prisma.alertSubscription.findUnique({ where: { id } });
  if (!sub || sub.userId !== userId) throw new AppError('Not found', 404);
  return prisma.alertSubscription.update({ where: { id }, data });
}

export async function deleteSubscription(id: string, userId: string) {
  const sub = await prisma.alertSubscription.findUnique({ where: { id } });
  if (!sub || sub.userId !== userId) throw new AppError('Not found', 404);
  return prisma.alertSubscription.delete({ where: { id } });
}
