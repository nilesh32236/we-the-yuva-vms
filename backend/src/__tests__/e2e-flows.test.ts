import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: '4000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'test-access-secret-at-least-32-chars-long!',
    JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars-long!',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    SMTP_HOST: '',
    SMTP_PORT: 587,
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_FROM: 'test@test.com',
    RESEND_API_KEY: '',
    VAPID_PUBLIC_KEY: '',
    VAPID_PRIVATE_KEY: '',
    FRONTEND_URL: 'http://localhost:3000',
    SENTRY_DSN: '',
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    organization: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    organizationDocument: { create: vi.fn(), findMany: vi.fn() },
    opportunity: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    opportunityApplication: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    application: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    location: { upsert: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    role: { findUnique: vi.fn(), findMany: vi.fn() },
    event: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    eventAttendance: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    userRole: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    volunteerProfile: { findUnique: vi.fn(), upsert: vi.fn() },
    staffProfile: { upsert: vi.fn() },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    pushSubscription: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    notificationPreference: { findUnique: vi.fn(), upsert: vi.fn() },
    eventFeedback: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    alertSubscription: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    story: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    course: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    lesson: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    lessonCompletion: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), count: vi.fn() },
    auditLog: { create: vi.fn() },
    eventQrToken: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn().mockImplementation((cb: any) =>
      cb({
        opportunity: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
        application: { count: vi.fn().mockResolvedValue(0), create: vi.fn() },
        user: { update: vi.fn() },
        volunteerProfile: { upsert: vi.fn() },
        attendance: { upsert: vi.fn() },
      })
    ),
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    $on: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/modules/users/users.service', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, getProfileStatus: vi.fn() };
});
vi.mock('@/lib/redis', () => ({ redis: null }));
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({ add: vi.fn().mockResolvedValue({ id: 'job-1' }) })),
}));
vi.mock('ioredis', () => {
  const Redis = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(900),
    multi: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([]),
    scan: vi.fn().mockResolvedValue(['0', []]),
  }));
  return { default: Redis, Redis };
});

const { prisma } = await import('@/lib/prisma');
const { getProfileStatus } = await import('@/modules/users/users.service');

describe('E2E Flows — service level', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Flow 1: register org -> verify -> create opportunity -> apply', () => {
    beforeEach(() => {
      vi.mocked(getProfileStatus).mockResolvedValue({
        isComplete: true,
        missingFields: [],
        completionPercentage: 100,
      });
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'role-oa',
        name: 'ORGANIZATION_ADMIN',
        description: '',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('registerOrganization creates pending org', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: null,
        roleRef: { name: 'ORGANIZATION_ADMIN' },
      } as any);
      vi.mocked(prisma.organization.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.organization.create).mockResolvedValue({
        id: 'org-1',
        name: 'Test Org',
        status: 'PENDING',
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const { registerOrganization } = await import(
        '../modules/organizations/organizations.service'
      );

      const org = await registerOrganization('u1', { name: 'Test Org', email: 'org@test.com' });
      expect(org.status).toBe('PENDING');
      expect(prisma.organization.create).toHaveBeenCalled();
    });

    it('verifyOrganization activates org', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({
        id: 'org-1',
        status: 'PENDING',
      } as any);
      vi.mocked(prisma.organization.update).mockResolvedValue({
        id: 'org-1',
        status: 'ACTIVE',
        verifiedAt: new Date(),
      } as any);

      const { verifyOrganization } = await import('../modules/organizations/organizations.service');

      const org = await verifyOrganization('org-1', true);
      expect(org.status).toBe('ACTIVE');
    });

    it('createOpportunity creates active opportunity', async () => {
      vi.mocked(prisma.opportunity.create).mockResolvedValue({
        id: 'opp-1',
        title: 'Teach Math',
        status: 'ACTIVE',
      } as any);

      const { createOpportunity } = await import('../modules/opportunities/opportunities.service');

      const opp = await createOpportunity('u1', 'org-1', {
        title: 'Teach Math to Kids',
        description: 'Help underprivileged children learn mathematics in a fun way',
        skills: ['Teaching'],
        category: 'EDUCATION',
        startDate: new Date('2026-08-01').toISOString(),
        endDate: new Date('2026-09-01').toISOString(),
        hoursPerSession: 2,
        totalSlots: 10,
        isRemote: false,
      });
      expect(opp.status).toBe('ACTIVE');
    });

    it('applyToOpportunity creates pending application', async () => {
      const { applyToOpportunity } = await import('../modules/opportunities/opportunities.service');

      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({
        id: 'opp-1',
        title: 'Test',
        createdById: 'coord-1',
      } as any);
      const tx = {
        opportunity: { findUnique: vi.fn() },
        application: { count: vi.fn(), create: vi.fn() },
      };
      vi.mocked(prisma.$transaction).mockImplementation((cb: any) => cb(tx));
      vi.mocked(tx.opportunity.findUnique).mockResolvedValue({
        id: 'opp-1',
        status: 'ACTIVE',
        totalSlots: 10,
      } as any);
      vi.mocked(tx.application.count).mockResolvedValue(2);
      vi.mocked(tx.application.create).mockResolvedValue({
        id: 'app-1',
        opportunityId: 'opp-1',
        volunteerId: 'v1',
        status: 'PENDING',
      } as any);

      const app = await applyToOpportunity('opp-1', 'v1');
      expect(app.status).toBe('PENDING');
    });

    it('applyToOpportunity rejects when no slots', async () => {
      const { applyToOpportunity } = await import('../modules/opportunities/opportunities.service');

      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({
        id: 'opp-1',
        title: 'Test',
        createdById: 'coord-1',
      } as any);
      const tx = {
        opportunity: { findUnique: vi.fn() },
        application: { count: vi.fn(), create: vi.fn() },
      };
      vi.mocked(prisma.$transaction).mockImplementation((cb: any) => cb(tx));
      vi.mocked(tx.opportunity.findUnique).mockResolvedValue({
        id: 'opp-1',
        status: 'ACTIVE',
        totalSlots: 5,
      } as any);
      vi.mocked(tx.application.count).mockResolvedValue(5);

      await expect(applyToOpportunity('opp-1', 'v1')).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('Flow 2: add coordinator -> manage events', () => {
    it('addCoordinatorToOrg creates coordinator in org', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({
        id: 'org-1',
        status: 'ACTIVE',
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: 'org-1',
        roleRef: { name: 'ORGANIZATION_ADMIN' },
      } as any);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'role-c',
        name: 'COORDINATOR',
        description: '',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.user.upsert).mockResolvedValue({
        id: 'coord-1',
        name: 'Coord',
        email: 'coord@org.com',
        organizationId: 'org-1',
        roleId: 'role-c',
      } as any);

      const { addCoordinatorToOrg } = await import(
        '../modules/organizations/organizations.service'
      );

      const coord = await addCoordinatorToOrg('org-1', 'admin-1', {
        name: 'Coord',
        email: 'coord@org.com',
      });
      expect(coord.organizationId).toBe('org-1');
    });

    it('createEvent creates event in org', async () => {
      vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({
        id: 'opp-1',
        createdById: 'coord-1',
        organizationId: 'org-1',
      } as any);
      vi.mocked(prisma.event.create).mockResolvedValue({
        id: 'ev-1',
        title: 'Cleanup',
        organizationId: 'org-1',
      } as any);
      vi.mocked(prisma.application.findMany).mockResolvedValue([]);

      const { createEvent } = await import('../modules/events/events.service');

      const ev = await createEvent('opp-1', 'coord-1', 'COORDINATOR', 'org-1', {
        title: 'Cleanup Drive',
        description: 'Park cleanup',
        eventDate: new Date('2026-07-15'),
        startTime: '09:00',
        endTime: '12:00',
        venue: 'Central Park',
        capacity: 50,
        isVirtual: false,
      });
      expect(ev.organizationId).toBe('org-1');
    });
  });

  describe('Flow 3: volunteer type -> org-scoped opportunities', () => {
    it('upsertVolunteerProfile sets type', async () => {
      const tx = { user: { update: vi.fn() }, volunteerProfile: { upsert: vi.fn() } };
      vi.mocked(prisma.$transaction).mockImplementation((cb: any) => cb(tx));
      vi.mocked(tx.user.update).mockResolvedValue({
        id: 'v1',
        volunteerType: 'PROFESSIONAL',
      } as any);
      vi.mocked(tx.volunteerProfile.upsert).mockResolvedValue({
        id: 'vp-1',
        userId: 'v1',
        volunteerType: 'PROFESSIONAL',
        skills: ['Teaching'],
        interests: ['Education'],
        availability: { days: ['Mon'], timeSlots: ['Morning'] },
      } as any);

      const { upsertVolunteerProfile } = await import('../modules/users/users.service');

      const profile = await upsertVolunteerProfile('v1', {
        volunteerType: 'PROFESSIONAL',
        skills: ['Teaching'],
        interests: ['Education'],
        availability: { days: ['Mon'], timeSlots: ['Morning'] },
      });
      expect(profile.volunteerType).toBe('PROFESSIONAL');
    });

    it('listOpportunities filters by org', async () => {
      vi.mocked(prisma.opportunity.findMany).mockResolvedValue([
        { id: 'opp-1', title: 'Teach Math', organizationId: 'org-1' } as any,
      ]);
      vi.mocked(prisma.opportunity.count).mockResolvedValue(1);

      const { listOpportunities } = await import('../modules/opportunities/opportunities.service');

      const result = await listOpportunities({ organizationId: 'org-1' }, { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
    });
  });
});
