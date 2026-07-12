import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { sendPushToUser } from './notifications.service';

export async function sendProfileReminders() {
  const incompleteUsers = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      profileComplete: false,
      pushSubscriptions: { some: {} },
    },
    select: {
      id: true,
      name: true,
    },
  });

  logger.info(`Sending profile reminders to ${incompleteUsers.length} users`);

  let sent = 0;
  for (const user of incompleteUsers) {
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

  return { sent, total: incompleteUsers.length };
}
