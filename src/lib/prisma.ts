import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

prisma.$on(
  'error' as never,
  ((e: unknown) => {
    logger.error('Prisma client error', { error: e });
  }) as never
);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
