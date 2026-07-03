import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    opportunity: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
      $transaction: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));
vi.mock('@/lib/redis', () => ({
  redis: { get: vi.fn(), set: vi.fn(), scan: vi.fn().mockResolvedValue(['0', []]), del: vi.fn() },
}));
vi.mock('@/lib/queue', () => ({
  notificationsQueue: { add: vi.fn().mockReturnValue(Promise.resolve({ id: 'job-1' })) },
}));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

const { prisma } = await import('@/lib/prisma');
const { redis } = await import('@/lib/redis');

import {
  applyToOpportunity,
  closeOpportunity,
  createOpportunity,
  getOpportunityById,
  listApplications,
  listMyApplications,
  listOpportunities,
  updateApplicationStatus,
  updateOpportunity,
  withdrawApplication,
} from '../opportunities.service';

describe('opportunities.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOpportunity', () => {
    it('should create opportunity with dates converted', async () => {
      const input = {
        title: 'Test Opp',
        description: 'A test opportunity for testing purposes',
        skills: ['Teaching'],
        category: 'EDUCATION' as const,
        startDate: '2026-06-15T00:00:00Z',
        endDate: '2026-07-15T00:00:00Z',
        hoursPerSession: 2,
        totalSlots: 10,
        isRemote: false,
      };
      vi.mocked(prisma.opportunity.create).mockResolvedValue({
        id: 'opp-1',
        title: 'Test Opp',
      } as never);

      await createOpportunity('user-1', 'org-1', input);
      expect(prisma.opportunity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdById: 'user-1',
            organizationId: 'org-1',
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('applyToOpportunity', () => {
    it('should throw 404 when opportunity not found', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const tx = { opportunity: { findUnique: vi.fn().mockResolvedValue(null) } };
          return cb(tx);
        }
      );
      await expect(applyToOpportunity('bad-opp', 'user-1')).rejects.toThrow(
        'Opportunity not found'
      );
    });

    it('should throw 400 when opportunity is not ACTIVE', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            opportunity: {
              findUnique: vi
                .fn()
                .mockResolvedValue({ id: 'opp-1', status: 'CLOSED', totalSlots: 5 }),
            },
          };
          return cb(tx);
        }
      );
      await expect(applyToOpportunity('opp-1', 'user-1')).rejects.toThrow(
        'not accepting applications'
      );
    });

    it('should throw 400 when no slots available', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            opportunity: {
              findUnique: vi
                .fn()
                .mockResolvedValue({ id: 'opp-1', status: 'ACTIVE', totalSlots: 2 }),
            },
            application: { count: vi.fn().mockResolvedValue(2) },
          };
          return cb(tx);
        }
      );
      await expect(applyToOpportunity('opp-1', 'user-1')).rejects.toThrow('No slots available');
    });

    it('should throw 409 on duplicate application', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            opportunity: {
              findUnique: vi
                .fn()
                .mockResolvedValue({ id: 'opp-1', status: 'ACTIVE', totalSlots: 5 }),
            },
            application: {
              count: vi.fn().mockResolvedValue(1),
              create: vi.fn().mockRejectedValue({ code: 'P2002' }),
            },
          };
          return cb(tx);
        }
      );
      await expect(applyToOpportunity('opp-1', 'user-1')).rejects.toThrow('Already applied');
    });

    it('should apply successfully', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            opportunity: {
              findUnique: vi
                .fn()
                .mockResolvedValue({ id: 'opp-1', status: 'ACTIVE', totalSlots: 5 }),
            },
            application: {
              count: vi.fn().mockResolvedValue(1),
              create: vi.fn().mockResolvedValue({ id: 'app-1', status: 'PENDING' }),
            },
          };
          return cb(tx);
        }
      );
      const result = await applyToOpportunity('opp-1', 'user-1');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('listOpportunities', () => {
    const baseFilters = {};
    const pagination = { page: 1, limit: 20 };

    it('should return from cache when available', async () => {
      vi.mocked(redis.get).mockResolvedValue(
        JSON.stringify({ data: [{ id: 'opp-1' }], total: 1, page: 1, limit: 20, totalPages: 1 })
      );
      const result = await listOpportunities(baseFilters, pagination);
      expect(result.data).toHaveLength(1);
      expect(prisma.opportunity.findMany).not.toHaveBeenCalled();
    });

    it('should query and cache when cache misses', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.opportunity.findMany).mockResolvedValue([{ id: 'opp-1' }] as never);
      vi.mocked(prisma.opportunity.count).mockResolvedValue(1);
      const result = await listOpportunities(baseFilters, pagination);
      expect(result.data).toHaveLength(1);
      expect(redis.set).toHaveBeenCalled();
    });

    it('should apply category filter', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.opportunity.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.opportunity.count).mockResolvedValue(0);
      await listOpportunities({ category: 'EDUCATION' }, pagination);
      expect(prisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ category: 'EDUCATION' }) })
      );
    });

    it('should apply skills filter', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.opportunity.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.opportunity.count).mockResolvedValue(0);
      await listOpportunities({ skills: ['Teaching'] }, pagination);
      expect(prisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ skills: { hasSome: ['Teaching'] } }),
        })
      );
    });

    it('should apply isRemote filter', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.opportunity.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.opportunity.count).mockResolvedValue(0);
      await listOpportunities({ isRemote: true }, pagination);
      expect(prisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isRemote: true }) })
      );
    });

    it('should apply locationId filter', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.opportunity.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.opportunity.count).mockResolvedValue(0);
      await listOpportunities({ locationId: 'loc-1' }, pagination);
      expect(prisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ locationId: 'loc-1' }) })
      );
    });

    it('should apply search filter', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.opportunity.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.opportunity.count).mockResolvedValue(0);
      await listOpportunities({ search: 'teach' }, pagination);
      expect(prisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ title: { contains: 'teach', mode: 'insensitive' } }),
        })
      );
    });

    it('should apply organizationId filter', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.opportunity.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.opportunity.count).mockResolvedValue(0);
      await listOpportunities({ organizationId: 'org-1' }, pagination);
      expect(prisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-1' }) })
      );
    });
  });

  describe('getOpportunityById', () => {
    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue(null);
      await expect(getOpportunityById('bad-id')).rejects.toThrow('Opportunity not found');
    });

    it('should return opportunity with includes', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({
        id: 'opp-1',
        createdBy: { name: 'User' },
        location: null,
        _count: { applications: 2 },
      } as never);
      const result = await getOpportunityById('opp-1');
      expect(result.id).toBe('opp-1');
    });
  });

  describe('updateOpportunity', () => {
    const input = {
      title: 'Updated',
      description: 'Desc',
      skills: [],
      category: 'EDUCATION' as const,
      startDate: '2026-06-15T00:00:00Z',
      endDate: '2026-07-15T00:00:00Z',
      hoursPerSession: 2,
      totalSlots: 10,
      isRemote: false,
    };

    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue(null);
      await expect(
        updateOpportunity('bad-id', 'user-1', 'COORDINATOR', 'org-1', input)
      ).rejects.toThrow('Opportunity not found');
    });

    it('should throw 403 when not authorized', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({
        id: 'opp-1',
        createdById: 'other-user',
        organizationId: 'other-org',
        status: 'ACTIVE',
      } as never);
      await expect(
        updateOpportunity('opp-1', 'user-1', 'VOLUNTEER', 'org-1', input)
      ).rejects.toThrow('Forbidden');
    });

    it('should update when sys admin', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({
        id: 'opp-1',
        createdById: 'other-user',
        organizationId: 'org-1',
        status: 'ACTIVE',
      } as never);
      vi.mocked(prisma.opportunity.update).mockResolvedValue({
        id: 'opp-1',
        title: 'Updated',
      } as never);
      const result = await updateOpportunity('opp-1', 'admin-1', 'ADMIN', null, input);
      expect(result.title).toBe('Updated');
    });
  });

  describe('closeOpportunity', () => {
    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue(null);
      await expect(closeOpportunity('bad-id', 'user-1', 'COORDINATOR', 'org-1')).rejects.toThrow(
        'Opportunity not found'
      );
    });

    it('should close opportunity successfully', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({
        id: 'opp-1',
        createdById: 'user-1',
        organizationId: 'org-1',
        status: 'ACTIVE',
      } as never);
      vi.mocked(prisma.opportunity.update).mockResolvedValue({
        id: 'opp-1',
        status: 'CLOSED',
      } as never);
      const result = await closeOpportunity('opp-1', 'user-1', 'COORDINATOR', 'org-1');
      expect(result.status).toBe('CLOSED');
    });
  });

  describe('listMyApplications', () => {
    it('should return without pagination', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([{ id: 'app-1' }] as never);
      const result = await listMyApplications('user-1');
      expect(result).toHaveLength(1);
    });

    it('should return with pagination', async () => {
      vi.mocked(prisma.application.findMany).mockResolvedValue([{ id: 'app-1' }] as never);
      vi.mocked(prisma.application.count).mockResolvedValue(1);
      const result = await listMyApplications('user-1', { page: 1, limit: 20 });
      expect(result.totalPages).toBe(1);
    });
  });

  describe('listApplications', () => {
    it('should throw 404 when opportunity not found', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue(null);
      await expect(
        listApplications('bad-opp', 'user-1', 'COORDINATOR', 'org-1', { page: 1, limit: 20 })
      ).rejects.toThrow('Opportunity not found');
    });

    it('should throw 403 when not authorized', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({
        id: 'opp-1',
        createdById: 'other-user',
        organizationId: 'other-org',
      } as never);
      await expect(
        listApplications('opp-1', 'user-1', 'VOLUNTEER', 'org-1', { page: 1, limit: 20 })
      ).rejects.toThrow('Forbidden');
    });

    it('should return paginated applications', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({
        id: 'opp-1',
        createdById: 'user-1',
        organizationId: 'org-1',
      } as never);
      vi.mocked(prisma.application.findMany).mockResolvedValue([{ id: 'app-1' }] as never);
      vi.mocked(prisma.application.count).mockResolvedValue(1);
      const result = await listApplications('opp-1', 'user-1', 'COORDINATOR', 'org-1', {
        page: 1,
        limit: 20,
      });
      expect(result.totalPages).toBe(1);
    });
  });

  describe('updateApplicationStatus', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should throw 404 when application not found', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue(null);
      await expect(
        updateApplicationStatus('bad-app', 'ACCEPTED', 'user-1', 'ADMIN', 'org-1')
      ).rejects.toThrow('Application not found');
    });

    it('should throw 403 when caller is not authorized', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        id: 'app-1',
        volunteerId: 'v-1',
        status: 'PENDING',
        opportunity: { createdById: 'other-user', organizationId: 'other-org', totalSlots: 5 },
      } as never);
      await expect(
        updateApplicationStatus('app-1', 'ACCEPTED', 'user-1', 'VOLUNTEER', 'org-1')
      ).rejects.toThrow('Forbidden');
    });

    it('should throw 400 when no slots available for ACCEPTED', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        id: 'app-1',
        volunteerId: 'v-1',
        status: 'PENDING',
        opportunityId: 'opp-1',
        opportunity: { createdById: 'user-1', organizationId: 'org-1', totalSlots: 2 },
      } as never);
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const tx = { application: { count: vi.fn().mockResolvedValue(2) } };
          return cb(tx);
        }
      );
      await expect(
        updateApplicationStatus('app-1', 'ACCEPTED', 'user-1', 'COORDINATOR', 'org-1')
      ).rejects.toThrow('No slots available');
    });

    it('should accept application and enqueue notification', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        id: 'app-1',
        volunteerId: 'v-1',
        status: 'PENDING',
        opportunityId: 'opp-1',
        opportunity: {
          title: 'Test Opp',
          createdById: 'user-1',
          organizationId: 'org-1',
          totalSlots: 5,
        },
      } as never);
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            application: {
              count: vi.fn().mockResolvedValue(1),
              update: vi.fn().mockResolvedValue({ id: 'app-1', status: 'ACCEPTED' }),
            },
          };
          return cb(tx);
        }
      );
      const result = await updateApplicationStatus(
        'app-1',
        'ACCEPTED',
        'user-1',
        'COORDINATOR',
        'org-1'
      );
      expect(result.status).toBe('ACCEPTED');
    });

    it('should reject application successfully', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        id: 'app-1',
        volunteerId: 'v-1',
        status: 'PENDING',
        opportunityId: 'opp-1',
        opportunity: {
          title: 'Test Opp',
          createdById: 'user-1',
          organizationId: 'org-1',
          totalSlots: 5,
        },
      } as never);
      vi.mocked(prisma.$transaction).mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            application: {
              update: vi.fn().mockResolvedValue({ id: 'app-1', status: 'REJECTED' }),
            },
          };
          return cb(tx);
        }
      );
      const result = await updateApplicationStatus(
        'app-1',
        'REJECTED',
        'user-1',
        'COORDINATOR',
        'org-1'
      );
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('withdrawApplication', () => {
    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue(null);
      await expect(withdrawApplication('bad-id', 'user-1')).rejects.toThrow(
        'Application not found'
      );
    });

    it('should throw 403 when not owner', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        id: 'app-1',
        volunteerId: 'other-user',
        status: 'PENDING',
      } as never);
      await expect(withdrawApplication('app-1', 'user-1')).rejects.toThrow('Forbidden');
    });

    it('should throw 400 when not pending', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        id: 'app-1',
        volunteerId: 'user-1',
        status: 'ACCEPTED',
      } as never);
      await expect(withdrawApplication('app-1', 'user-1')).rejects.toThrow(
        'Only pending applications can be withdrawn'
      );
    });

    it('should withdraw successfully', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValue({
        id: 'app-1',
        volunteerId: 'user-1',
        status: 'PENDING',
        opportunityId: 'opp-1',
      } as never);
      vi.mocked(prisma.application.update).mockResolvedValue({
        id: 'app-1',
        status: 'REJECTED',
      } as never);
      const result = await withdrawApplication('app-1', 'user-1');
      expect(result.status).toBe('REJECTED');
    });
  });
});
