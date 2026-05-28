import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { notificationsQueue } from './lib/queue';
import { initSentry } from './lib/sentry';
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

  const server = app.listen(Number(env.PORT), () => {
    logger.info(`API server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
    logger.info('BullMQ notification worker started');
    void notificationWorker;
  });

  // Register repeatable jobs (graceful if Redis unavailable)
  try {
    await notificationsQueue.add('check-event-reminders', {}, { repeat: { every: 60 * 60 * 1000 } });
    await notificationsQueue.add('clean-expired-qr-tokens', {}, { repeat: { every: 60 * 60 * 1000 } });
    await notificationsQueue.add('daily-metrics-snapshot', {}, { repeat: { pattern: '0 0 * * *' } });
    logger.info('BullMQ repeatable jobs registered');
  } catch (error) {
    logger.warn('BullMQ/Redis unavailable — repeatable jobs skipped', { error: (error as Error).message });
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await notificationWorker.close();
      await prisma.$disconnect();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
