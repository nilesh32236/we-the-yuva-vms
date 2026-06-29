import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { notificationsQueue } from './lib/queue';
import * as Sentry from '@sentry/node';
import { initSentry } from './lib/sentry';
import { seedCoursesIfEmpty } from './modules/training/training.service';
import { notificationWorker } from './workers/notification.worker';

async function main() {
  initSentry();
  const app = createApp();

  // Verify database connection
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error('Database connection failed', { error });
    process.exit(1);
  }

  // Seed default training courses if DB is empty (dev mode only)
  await seedCoursesIfEmpty();

  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    logger.warn('VAPID keys not configured — push notifications will be disabled');
  }

  const server = app.listen(Number(env.PORT), () => {
    logger.info(`API server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
    logger.info('BullMQ notification worker started');
    void notificationWorker;
  });

  // Register repeatable jobs (graceful if Redis unavailable)
  try {
    await notificationsQueue?.add(
      'check-event-reminders',
      {},
      { repeat: { every: 60 * 60 * 1000 } }
    );
    await notificationsQueue?.add(
      'clean-expired-qr-tokens',
      {},
      { repeat: { every: 60 * 60 * 1000 } }
    );
    await notificationsQueue?.add(
      'daily-metrics-snapshot',
      {},
      { repeat: { pattern: '0 0 * * *' } }
    );
    await notificationsQueue?.add(
      'daily-streak-update',
      {},
      { repeat: { pattern: '0 2 * * *' } }
    );
    await notificationsQueue?.add(
      'cleanup-pending-users',
      {},
      { repeat: { pattern: '0 3 * * *' } }
    );
    logger.info('BullMQ repeatable jobs registered');
  } catch (error) {
    logger.warn('BullMQ/Redis unavailable — repeatable jobs skipped', {
      error: (error as Error).message,
    });
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);

    const forceExit = setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
    forceExit.unref();

    server.close(async () => {
      clearTimeout(forceExit);
      await notificationWorker?.close();
      await prisma.$disconnect();
      await Sentry.flush(2000);
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('UNHANDLED REJECTION', { err: reason });
    Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
    process.exit(1);
  });

  process.on('uncaughtException', async (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    Sentry.captureException(error);
    await Sentry.flush(2000);
    process.exit(1);
  });
}

main().catch((error) => {
  logger.error('Fatal startup error', { error });
  process.exit(1);
});
