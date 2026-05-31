import { describe, it, expect } from 'vitest';
import { prisma as prisma1 } from '../prisma';
import { prisma as prisma2 } from '../prisma';

describe('Prisma Singleton', () => {
  it('should return the same prisma instance (singleton)', () => {
    expect(prisma1).toBe(prisma2);
    expect(prisma1).toBeDefined();
    
    // Check if it's attached to globalThis in non-production
    if (process.env.NODE_ENV !== 'production') {
      const globalForPrisma = globalThis as unknown as {
        prisma: typeof prisma1 | undefined;
      };
      expect(globalForPrisma.prisma).toBe(prisma1);
    }
  });
});
