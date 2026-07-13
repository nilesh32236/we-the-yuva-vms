import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notificationPreference: { findMany: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

const { prisma } = await import('@/lib/prisma');

import { getPreferences, updatePreference } from '../preferences.service';

describe('preferences.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should return existing preferences', async () => {
      vi.mocked(prisma.notificationPreference.findMany).mockResolvedValue([
        { id: 'p1', type: 'APPLICATION_ACCEPTED', email: true, push: true, userId: 'user-1' },
      ] as never);
      const result = await getPreferences('user-1');
      expect(result).toHaveLength(1);
    });

    it('should initialize defaults when no preferences exist', async () => {
      vi.mocked(prisma.notificationPreference.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notificationPreference.upsert).mockResolvedValue({} as never);
      const result = await getPreferences('user-1');
      expect(result).toHaveLength(14);
    });
  });

  describe('updatePreference', () => {
    it('should upsert preference', async () => {
      vi.mocked(prisma.notificationPreference.upsert).mockResolvedValue({
        id: 'p1',
        type: 'APPLICATION_ACCEPTED',
        email: false,
        push: true,
      } as never);
      const result = await updatePreference('user-1', 'APPLICATION_ACCEPTED', { email: false });
      expect(result.email).toBe(false);
    });
  });
});
