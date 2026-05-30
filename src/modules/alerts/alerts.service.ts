import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export async function getMySubscriptions(userId: string, pagination?: { page: number; limit: number }) {
  if (!pagination) {
    return prisma.alertSubscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.alertSubscription.findMany({ where: { userId }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.alertSubscription.count({ where: { userId } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
