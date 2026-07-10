import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    volunteerProfile: { findUnique: vi.fn(), aggregate: vi.fn() },
    attendance: { count: vi.fn(), findMany: vi.fn(), aggregate: vi.fn() },
    application: { count: vi.fn(), findMany: vi.fn() },
    event: { count: vi.fn() },
    opportunity: { count: vi.fn() },
    user: { count: vi.fn() },
    organization: { count: vi.fn(), groupBy: vi.fn() },
    story: { count: vi.fn() },
    eventFeedback: { count: vi.fn() },
  },
}));

const { prisma } = await import('@/lib/prisma');

import {
  getAdminOrgStats,
  getAdminStats,
  getCoordinatorStats,
  getObserverStats,
  getVolunteerImpactData,
  getVolunteerStats,
} from '../stats.service';

describe('stats.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVolunteerStats', () => {
    it('should return aggregated stats', async () => {
      vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({ totalHours: 25 } as never);
      vi.mocked(prisma.attendance.count).mockResolvedValue(10);
      vi.mocked(prisma.attendance.aggregate).mockResolvedValue({ _avg: { rating: 4.2 } } as never);
      vi.mocked(prisma.application.count).mockResolvedValue(5);
      const result = await getVolunteerStats('user-1');
      expect(result.totalHours).toBe(25);
      expect(result.eventsAttended).toBe(10);
      expect(result.applications).toBe(5);
      expect(result.avgRating).toBe(4.2);
    });
  });

  describe('getCoordinatorStats', () => {
    it('should return coordinator stats with org filter', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([
        { volunteerId: 'v1' },
        { volunteerId: 'v2' },
      ] as never);
      vi.mocked(prisma.event.count).mockResolvedValue(3);
      vi.mocked(prisma.opportunity.count).mockResolvedValue(5);
      const result = await getCoordinatorStats('coord-1', 'org-1');
      expect(result.activeVolunteers).toBe(2);
      expect(result.eventsThisMonth).toBe(3);
      expect(result.opportunities).toBe(5);
    });

    it('should return coordinator stats without org filter', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.event.count).mockResolvedValue(0);
      vi.mocked(prisma.opportunity.count).mockResolvedValue(1);
      const result = await getCoordinatorStats('coord-1', null);
      expect(result.activeVolunteers).toBe(0);
      expect(result.eventsThisMonth).toBe(0);
      expect(result.opportunities).toBe(1);
    });
  });

  describe('getAdminStats', () => {
    it('should return admin dashboard stats', async () => {
      vi.mocked(prisma.user.count).mockResolvedValueOnce(100).mockResolvedValueOnce(50);
      vi.mocked(prisma.volunteerProfile.aggregate).mockResolvedValue({
        _sum: { totalHours: 500 },
      } as never);
      vi.mocked(prisma.organization.groupBy).mockResolvedValue([
        { status: 'ACTIVE', _count: 5 },
        { status: 'PENDING', _count: 2 },
      ] as never);

      const result = await getAdminStats();
      expect(result.totalUsers).toBe(100);
      expect(result.totalOrgs).toBe(7);
      expect(result.activeOrgs).toBe(5);
      expect(result.pendingOrgs).toBe(2);
    });
  });

  describe('getAdminOrgStats', () => {
    it('should return org counts by status', async () => {
      vi.mocked(prisma.organization.count)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(2);
      const result = await getAdminOrgStats();
      expect(result.total).toBe(20);
      expect(result.pending).toBe(3);
      expect(result.active).toBe(15);
      expect(result.suspended).toBe(2);
    });
  });

  describe('getVolunteerImpactData', () => {
    it('should return impact data with monthly/category breakdown', async () => {
      vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({ totalHours: 50 } as never);
      vi.mocked(prisma.application.count).mockResolvedValue(10);
      vi.mocked(prisma.attendance.findMany).mockResolvedValue([]);
      vi.mocked(prisma.story.count).mockResolvedValue(3);
      vi.mocked(prisma.eventFeedback.count).mockResolvedValue(5);

      const result = await getVolunteerImpactData('user-1');
      expect(result.totalHours).toBe(50);
      expect(result.storiesCount).toBe(3);
    });

    it('should calculate hours from checkedInAt/checkedOutAt', async () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 7200000);
      vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({ totalHours: 0 } as never);
      vi.mocked(prisma.application.count).mockResolvedValue(0);
      vi.mocked(prisma.attendance.findMany).mockResolvedValue([
        {
          checkedInAt: twoHoursAgo,
          checkedOutAt: now,
          event: { eventDate: now, opportunity: { category: 'EDUCATION', hoursPerSession: 1 } },
        },
      ] as never);
      vi.mocked(prisma.story.count).mockResolvedValue(0);
      vi.mocked(prisma.eventFeedback.count).mockResolvedValue(0);

      const result = await getVolunteerImpactData('user-1');
      expect(result.eventsAttended).toBe(1);
      expect(result.monthlyHours.length).toBe(12);
    });

    it('should fall back to hoursPerSession when no check-in/out', async () => {
      const now = new Date();
      vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({ totalHours: 0 } as never);
      vi.mocked(prisma.application.count).mockResolvedValue(0);
      vi.mocked(prisma.attendance.findMany).mockResolvedValue([
        {
          checkedInAt: null,
          checkedOutAt: null,
          event: { eventDate: now, opportunity: { category: 'HEALTH', hoursPerSession: 3 } },
        },
      ] as never);
      vi.mocked(prisma.story.count).mockResolvedValue(0);
      vi.mocked(prisma.eventFeedback.count).mockResolvedValue(0);

      const result = await getVolunteerImpactData('user-1');
      expect(result.categoryHours).toHaveLength(1);
      expect(result.categoryHours[0].category).toBe('HEALTH');
    });
  });

  describe('getObserverStats', () => {
    it('should return observer-level stats', async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(100);
      vi.mocked(prisma.volunteerProfile.aggregate).mockResolvedValue({
        _sum: { totalHours: 500 },
      } as never);
      vi.mocked(prisma.event.count).mockResolvedValue(10);
      const result = await getObserverStats();
      expect(result.totalVolunteers).toBe(100);
      expect(result.activeEvents).toBe(10);
    });
  });
});
