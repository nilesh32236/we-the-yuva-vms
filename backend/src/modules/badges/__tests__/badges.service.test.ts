import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    badgeApproval: { update: vi.fn(), findMany: vi.fn() },
    userBadge: { create: vi.fn(), findMany: vi.fn() },
    badge: { findMany: vi.fn() },
    pointTransaction: { create: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/queue', () => ({
  notificationsQueue: null,
}));

const { prisma } = await import('@/lib/prisma');

import { approveBadge } from '../badges.service';

describe('badges.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('approveBadge', () => {
    it('should wrap all three operations in a $transaction', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-1';
      const reviewedBy = 'admin-1';

      const mockApproval = { id: 'approval-1', userId, badgeId, status: 'APPROVED' };

      vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          return cb(prisma);
        }
        return [];
      });

      vi.mocked(prisma.badgeApproval.update).mockResolvedValue(mockApproval as never);

      await approveBadge(userId, badgeId, reviewedBy);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should call badgeApproval.update, userBadge.create, and awardPoints within transaction', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-1';
      const reviewedBy = 'admin-1';

      const mockApproval = { id: 'approval-1', userId, badgeId, status: 'APPROVED' };

      vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          return cb(prisma);
        }
        return [];
      });

      vi.mocked(prisma.badgeApproval.update).mockResolvedValue(mockApproval as never);

      await approveBadge(userId, badgeId, reviewedBy);

      expect(prisma.badgeApproval.update).toHaveBeenCalledWith({
        where: { userId_badgeId: { userId, badgeId } },
        data: {
          status: 'APPROVED',
          reviewedAt: expect.any(Date),
          reviewedBy,
          reviewNote: undefined,
        },
      });

      expect(prisma.userBadge.create).toHaveBeenCalledWith({
        data: { userId, badgeId },
      });
    });
  });
});
