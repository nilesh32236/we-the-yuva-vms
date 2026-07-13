import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    badge: { findMany: vi.fn() },
    userBadge: { findMany: vi.fn(), create: vi.fn() },
    badgeApproval: { findMany: vi.fn(), upsert: vi.fn() },
    attendance: { count: vi.fn(), findMany: vi.fn() },
    volunteerProfile: { findUnique: vi.fn() },
    courseProgress: { count: vi.fn() },
    mentorship: { count: vi.fn() },
    user: { findUnique: vi.fn(), count: vi.fn(), update: vi.fn() },
    story: { count: vi.fn() },
    pointTransaction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/queue', () => ({
  notificationsQueue: null,
}));

const { prisma } = await import('@/lib/prisma');

import { checkAndAwardBadges } from '../badge-engine.service';

function makeBadge(overrides: Record<string, unknown> = {}) {
  return {
    id: 'badge-1',
    name: 'TEST_BADGE',
    title: 'Test Badge',
    description: 'A test badge',
    imageUrl: '/badges/test.png',
    requiresApproval: false,
    criteria: { type: 'FIRST_EVENT' },
    createdAt: new Date(),
    ...overrides,
  } as never;
}

describe('badge-engine.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (ops: unknown) => {
      if (Array.isArray(ops)) {
        return Promise.all(ops.map((op: unknown) => (op as Promise<unknown>)));
      }
      return [];
    });
  });

  describe('REJECTED badge re-submission', () => {
    it('should reset REJECTED badgeApproval to PENDING with null review fields when criteria are met again', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-1';

      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        makeBadge({ id: badgeId, name: 'ONBOARDING', requiresApproval: true, criteria: { type: 'ONBOARDING_COMPLETE' } }),
      ]);

      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.badgeApproval.findMany).mockResolvedValue([]);

      vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({ userId, bio: 'test' } as never);
      vi.mocked(prisma.courseProgress.count).mockResolvedValue(1);

      await checkAndAwardBadges(userId);

      expect(prisma.badgeApproval.upsert).toHaveBeenCalledWith({
        where: { userId_badgeId: { userId, badgeId } },
        update: { status: 'PENDING', reviewedAt: null, reviewedBy: null, reviewNote: null },
        create: { userId, badgeId },
      });
    });

    it('should skip badges already earned', async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([makeBadge({ id: 'b1' })]);
      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([{ badgeId: 'b1' }] as never);

      const result = await checkAndAwardBadges('user-1');
      expect(result).toHaveLength(0);
    });

    it('should skip badges with PENDING approval', async () => {
      vi.mocked(prisma.badge.findMany).mockResolvedValue([makeBadge({ id: 'b1' })]);
      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.badgeApproval.findMany).mockResolvedValue([{ badgeId: 'b1' }] as never);

      const result = await checkAndAwardBadges('user-1');
      expect(result).toHaveLength(0);
    });
  });

  describe('REFERRALS criteria', () => {
    it('should count users where referredById matches userId', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-2';

      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        makeBadge({ id: badgeId, name: 'COMMUNITY_BUILDER', requiresApproval: false, criteria: { type: 'REFERRALS', count: 3 } }),
      ]);

      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.badgeApproval.findMany).mockResolvedValue([]);

      vi.mocked(prisma.user.count).mockResolvedValue(5);

      await checkAndAwardBadges(userId);

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { referredById: userId },
      });
    });

    it('should award badge when referral count meets threshold', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-2';

      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        makeBadge({ id: badgeId, name: 'COMMUNITY_BUILDER', requiresApproval: false, criteria: { type: 'REFERRALS', count: 3 } }),
      ]);

      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.badgeApproval.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(5);

      const result = await checkAndAwardBadges(userId);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(badgeId);
    });

    it('should not award badge when referral count is below threshold', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-2';

      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        makeBadge({ id: badgeId, name: 'COMMUNITY_BUILDER', requiresApproval: false, criteria: { type: 'REFERRALS', count: 3 } }),
      ]);

      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.badgeApproval.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const result = await checkAndAwardBadges(userId);
      expect(result).toHaveLength(0);
    });
  });

  describe('GRIEVANCES_RESOLVED criteria', () => {
    it('should return false with a TODO note (not yet implemented)', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-3';

      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        makeBadge({ id: badgeId, name: 'PROBLEM_SOLVER', requiresApproval: false, criteria: { type: 'GRIEVANCES_RESOLVED', count: 5 } }),
      ]);

      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.badgeApproval.findMany).mockResolvedValue([]);

      const result = await checkAndAwardBadges(userId);
      expect(result).toHaveLength(0);
    });
  });

  describe('INDUCTION criteria', () => {
    it('should require BOTH eventsCount AND hoursCount to be met (&&)', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-induction';

      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        makeBadge({
          id: badgeId,
          name: 'INDUCTION',
          requiresApproval: false,
          criteria: { type: 'INDUCTION', eventsCount: 3, hoursCount: 10 },
        }),
      ]);

      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.badgeApproval.findMany).mockResolvedValue([]);

      // Only events met, hours not met
      vi.mocked(prisma.attendance.count).mockResolvedValue(3);
      vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({ totalHours: 5 } as never);

      const result = await checkAndAwardBadges(userId);
      expect(result).toHaveLength(0);
    });
  });

  describe('MOBILIZER criteria', () => {
    it('should require ALL three conditions (events, hours, referrals) to be met (&&)', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-mobilizer';

      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        makeBadge({
          id: badgeId,
          name: 'MOBILIZER',
          requiresApproval: false,
          criteria: { type: 'MOBILIZER', eventsCount: 5, hoursCount: 20, referralsCount: 3 },
        }),
      ]);

      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.badgeApproval.findMany).mockResolvedValue([]);

      // All three met
      vi.mocked(prisma.attendance.count).mockResolvedValue(5);
      vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({ totalHours: 25 } as never);
      vi.mocked(prisma.user.count).mockResolvedValue(3);

      const result = await checkAndAwardBadges(userId);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(badgeId);
    });

    it('should not award when only events and hours are met but referrals is not', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-mobilizer';

      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        makeBadge({
          id: badgeId,
          name: 'MOBILIZER',
          requiresApproval: false,
          criteria: { type: 'MOBILIZER', eventsCount: 5, hoursCount: 20, referralsCount: 3 },
        }),
      ]);

      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.badgeApproval.findMany).mockResolvedValue([]);

      vi.mocked(prisma.attendance.count).mockResolvedValue(5);
      vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({ totalHours: 25 } as never);
      vi.mocked(prisma.user.count).mockResolvedValue(1); // referrals not met

      const result = await checkAndAwardBadges(userId);
      expect(result).toHaveLength(0);
    });
  });

  describe('LEADER criteria', () => {
    it('should require ALL three conditions (events, hours, mentees) to be met (&&)', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-leader';

      vi.mocked(prisma.badge.findMany).mockResolvedValue([
        makeBadge({
          id: badgeId,
          name: 'LEADER',
          requiresApproval: false,
          criteria: { type: 'LEADER', eventsCount: 10, hoursCount: 50, menteesCount: 3 },
        }),
      ]);

      vi.mocked(prisma.userBadge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.badgeApproval.findMany).mockResolvedValue([]);

      // Only events and hours met, but not mentees
      vi.mocked(prisma.attendance.count).mockResolvedValue(10);
      vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({ totalHours: 60 } as never);
      vi.mocked(prisma.mentorship.count).mockResolvedValue(1);

      const result = await checkAndAwardBadges(userId);
      expect(result).toHaveLength(0);
    });
  });
});
