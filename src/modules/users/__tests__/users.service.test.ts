import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    volunteerProfile: { upsert: vi.fn(), findUnique: vi.fn() },
    staffProfile: { upsert: vi.fn() },
    location: { upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const { prisma } = await import('@/lib/prisma');

import {
  exportCoordinatorVolunteers,
  getCoordinatorVolunteers,
  getMe,
  getUserProfile,
  updateUser,
  upsertStaffProfile,
  upsertVolunteerProfile,
} from '../users.service';

describe('users.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user for self', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        profile: null,
        location: null,
      } as never);
      const result = await getUserProfile('user-1', 'user-1', 'VOLUNTEER', null);
      expect(result).toBeDefined();
    });

    it('should return user for admin', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-2',
        profile: null,
        location: null,
      } as never);
      const result = await getUserProfile('user-2', 'admin-id', 'ADMIN', null);
      expect(result.id).toBe('user-2');
    });

    it('should throw 404 if not self and not admin and not in org', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      await expect(getUserProfile('user-2', 'user-1', 'VOLUNTEER', null)).rejects.toThrow(
        'User not found or access denied'
      );
    });

    it('should allow coordinator to view user in same org', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'user-2',
        profile: null,
        location: null,
      } as never);
      const result = await getUserProfile('user-2', 'coord-1', 'COORDINATOR', 'org-1');
      expect(result.id).toBe('user-2');
      expect(prisma.user.findFirst).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return user with profile and role', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'u@t.com',
        name: 'User',
        roleRef: { name: 'VOLUNTEER' },
        status: 'ACTIVE',
        locationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        volunteerType: null,
        badges: [],
        points: 0,
        level: 0,
        organizationId: null,
        profile: null,
        consent: null,
        location: null,
      } as never);
      const result = await getMe('user-1');
      expect(result.role).toBe('VOLUNTEER');
    });

    it('should throw 404 when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      await expect(getMe('bad-id')).rejects.toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
        profile: null,
        location: null,
      } as never);
      const _result = await updateUser('user-1', { name: 'New Name' });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'New Name' }) })
      );
    });

    it('should throw 409 when email already in use', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'other-user' } as never);
      await expect(updateUser('user-1', { email: 'taken@t.com' })).rejects.toThrow(
        'Email already in use'
      );
    });
  });

  describe('upsertVolunteerProfile', () => {
    it('should update volunteerType and upsert profile in transaction', async () => {
      vi.mocked(prisma.volunteerProfile.upsert).mockResolvedValue({
        id: 'vp-1',
        userId: 'user-1',
        skills: ['a'],
        interests: ['b'],
        availability: { days: ['Mon'], timeSlots: ['Morning'] },
        totalHours: 0,
      } as never);
      const _mockTx = vi.fn();
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: typeof prisma) => Promise<unknown>) => {
          const tx = {
            user: { update: vi.fn().mockResolvedValue({}) },
            volunteerProfile: { upsert: vi.fn().mockResolvedValue({ id: 'vp-1' }) },
          };
          return cb(tx as never);
        }
      );

      const result = await upsertVolunteerProfile('user-1', {
        volunteerType: 'STUDENT',
        skills: ['a'],
        interests: ['b'],
        availability: { days: ['Mon'], timeSlots: ['Morning'] },
      } as never);
      expect(result).toBeDefined();
    });
  });

  describe('getCoordinatorVolunteers', () => {
    it('should return filtered paginated volunteers', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      const result = await getCoordinatorVolunteers('coord-1', null, {}, { page: 1, limit: 20 });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should filter by search query', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'v-1', name: 'John Doe', email: 'john@t.com', volunteerType: null, profile: null, _count: { applications: 0 } },
        { id: 'v-2', name: 'Jane Smith', email: 'jane@t.com', volunteerType: null, profile: null, _count: { applications: 0 } },
      ] as never);
      const result = await getCoordinatorVolunteers('coord-1', 'org-1', { search: 'john' }, { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('v-1');
    });

    it('should filter by skills', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'v-1', name: 'A', email: 'a@t.com', volunteerType: null, profile: { skills: ['Teaching'] }, _count: { applications: 1 } },
        { id: 'v-2', name: 'B', email: 'b@t.com', volunteerType: null, profile: { skills: ['Cooking'] }, _count: { applications: 1 } },
      ] as never);
      const result = await getCoordinatorVolunteers('coord-1', 'org-1', { skills: ['Teaching'] }, { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('v-1');
    });
  });

  describe('exportCoordinatorVolunteers', () => {
    it('should return mapped volunteer data', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        {
          id: 'v-1',
          name: 'Vol',
          email: 'v@t.com',
          volunteerType: 'STUDENT',
          profile: { skills: ['Teaching'], totalHours: 10 },
          _count: { applications: 3 },
        },
      ] as never);
      const result = await exportCoordinatorVolunteers('coord-1', 'org-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Vol');
      expect(result[0].totalHours).toBe(10);
    });
  });

  describe('upsertStaffProfile', () => {
    it('should upsert location and staff profile', async () => {
      vi.mocked(prisma.location.upsert).mockResolvedValue({ id: 'loc-mumbai-mh' } as never);
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);
      vi.mocked(prisma.staffProfile.upsert).mockResolvedValue({ id: 'sp-1' } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        location: { id: 'loc-mumbai-mh' },
        staffProfile: { id: 'sp-1' },
      } as never);

      const result = await upsertStaffProfile('user-1', {
        locationName: 'Mumbai',
        district: 'Mumbai',
        state: 'MH',
        department: 'Education',
        designation: 'Teacher',
      });
      expect(result.staffProfile).toBeDefined();
    });
  });
});
