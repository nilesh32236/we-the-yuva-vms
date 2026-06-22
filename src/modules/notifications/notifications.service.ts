import type { NotificationPreferenceType, NotificationType } from '@prisma/client';
import webpush from 'web-push';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${env.SMTP_FROM || 'admin@wetheyuva.org'}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
} else {
  logger.warn('VAPID keys not configured - push notifications disabled');
}

export async function subscribe(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  await prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId, endpoint: subscription.endpoint } },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  });
  return { ok: true };
}

export async function unsubscribe(userId: string, endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  return { ok: true };
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  link?: string,
  type: NotificationType = 'INFO',
  prefType?: NotificationPreferenceType
) {
  if (prefType) {
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type: prefType } },
    });
    if (pref && !pref.push) return;
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });

  await prisma.notification.create({ data: { userId, title, body, link, type } });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, link })
      );
    } catch (err) {
      logger.warn('Push send failed, removing subscription', {
        endpoint: sub.endpoint.slice(0, 30),
        error: (err as Error).message,
      });
      await prisma.pushSubscription
        .deleteMany({ where: { endpoint: sub.endpoint } })
        .catch((err) =>
          logger.warn('Failed to clean up push subscription', { error: (err as Error).message })
        );
    }
  }
}

export async function getNotifications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getNotification(userId: string, notificationId: string) {
  const n = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!n) throw new AppError('Notification not found', 404);
  return n;
}

export async function deleteNotification(userId: string, notificationId: string) {
  const n = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!n) throw new AppError('Notification not found', 404);
  return prisma.notification.delete({ where: { id: notificationId } });
}

export async function markRead(userId: string, notificationId: string) {
  const n = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!n) throw new AppError('Notification not found', 404);
  return prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  return { ok: true };
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}
