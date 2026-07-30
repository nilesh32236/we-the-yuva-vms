import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development'
      ? ['query', { level: 'error', emit: 'event' }, 'warn']
      : [{ level: 'error', emit: 'event' }],
  });

prisma.$on('error' as Parameters<typeof prisma.$on>[0], (e: { message: string }) => {
  logger.error('Prisma client error', { error: e.message });
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
