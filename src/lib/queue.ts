import { Queue } from 'bullmq';
import { redis } from './redis';
import { logger } from './logger';

let notificationsQueue: Queue | null = null;

if (redis) {
  notificationsQueue = new Queue('notifications', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });
} else {
  logger.warn('BullMQ queue not initialized — Redis unavailable');
}

export { notificationsQueue };
