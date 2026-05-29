import type { NotificationPreferenceType } from '@prisma/client';
import { prisma } from '../../lib/prisma';

const DEFAULT_PREFERENCES: NotificationPreferenceType[] = [
  'APPLICATION_ACCEPTED',
  'EVENT_REMINDER',
  'PROMOTION',
  'WEEKLY_DIGEST',
  'SYSTEM_ANNOUNCEMENT',
];

export async function getPreferences(userId: string) {
  const existing = await prisma.notificationPreference.findMany({ where: { userId } });
  if (existing.length === 0) {
    for (const type of DEFAULT_PREFERENCES) {
      await prisma.notificationPreference.upsert({
        where: { userId_type: { userId, type } },
        create: { userId, type },
        update: {},
      }).catch(() => {});
    }
    return DEFAULT_PREFERENCES.map((type) => ({ type, email: true, push: true }));
  }
  return existing;
}

export async function updatePreference(
  userId: string,
  type: NotificationPreferenceType,
  data: { email?: boolean; push?: boolean }
) {
  return prisma.notificationPreference.upsert({
    where: { userId_type: { userId, type } },
    create: { userId, type, email: data.email ?? true, push: data.push ?? true },
    update: {
      ...(data.email !== undefined && { email: data.email }),
      ...(data.push !== undefined && { push: data.push }),
    },
  });
}
