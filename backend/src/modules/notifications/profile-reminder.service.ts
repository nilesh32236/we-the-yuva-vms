import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { sendPushToUser } from './notifications.service';

const BATCH_SIZE = 100;

export async function sendProfileReminders() {
  let sent = 0;
  let total = 0;
  let cursor: string | undefined;

  for (;;) {
    const batch = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        profileComplete: false,
        pushSubscriptions: { some: {} },
      },
      select: { id: true, name: true },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
    });

    if (batch.length === 0) break;

    total += batch.length;

    for (const user of batch) {
      try {
        await sendPushToUser(
          user.id,
          'Complete Your Profile',
          `Hi ${user.name}, your volunteer profile is incomplete. Finish setting it up to unlock all features!`,
          '/setup-profile',
          'WARNING',
          'PROFILE_REMINDER'
        );
        sent++;
      } catch (err) {
        logger.error('Failed to send profile reminder', {
          userId: user.id,
          error: (err as Error).message,
        });
      }
    }

    cursor = batch[batch.length - 1].id;
  }

  logger.info(`Sent profile reminders to ${sent} of ${total} users`);

  return { sent, total };
}
