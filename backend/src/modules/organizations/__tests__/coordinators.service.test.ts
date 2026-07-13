import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    user: { findUnique: vi.fn(), upsert: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
    role: { findUnique: vi.fn() },
  },
}));

const { prisma } = await import('@/lib/prisma');

import { addCoordinatorToOrg, listCoordinators, removeCoordinatorFromOrg } from '../organizations.service';

describe('coordinators.service (via organizations.service)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addCoordinatorToOrg', () => {
    it('should throw 404 when org not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
      await expect(
        addCoordinatorToOrg('org-1', 'caller-id', { name: 'C', email: 'c@t.com' })
      ).rejects.toThrow('Organization not found');
    });

    it('should upsert coordinator user', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: 'org-1',
        roleRef: { name: 'ORGANIZATION_ADMIN' },
      } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'coord-role-id',
        name: 'COORDINATOR',
      } as never);
      vi.mocked(prisma.user.upsert).mockResolvedValue({
        id: 'coord-1',
        name: 'C',
        email: 'c@t.com',
        status: 'ACTIVE',
      } as never);

      const result = await addCoordinatorToOrg('org-1', 'caller-id', { name: 'C', email: 'c@t.com' });
      expect(result.id).toBe('coord-1');
      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'c@t.com' },
          update: expect.objectContaining({ organizationId: 'org-1' }),
          create: expect.objectContaining({ email: 'c@t.com' }),
        })
      );
    });

    it('should throw 400 when caller not authorized', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: null,
        roleRef: { name: 'VOLUNTEER' },
      } as never);

      await expect(
        addCoordinatorToOrg('org-1', 'caller-id', { name: 'C', email: 'c@t.com' })
      ).rejects.toThrow('Unauthorized to add coordinators');
    });
  });

  describe('listCoordinators', () => {
    it('should list coordinators for an org', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'c1', name: 'C1', email: 'c1@t.com', status: 'ACTIVE', createdAt: new Date() },
      ] as never);

      const result = await listCoordinators('org-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('removeCoordinatorFromOrg', () => {
    it('should throw 400 when caller not authorized', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: 'other-org',
        roleRef: { name: 'VOLUNTEER' },
      } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'coord-1',
        organizationId: 'org-1',
        roleRef: { name: 'COORDINATOR' },
      } as never);

      await expect(removeCoordinatorFromOrg('org-1', 'caller-id', 'coord-1')).rejects.toThrow(
        'Unauthorized to remove coordinators'
      );
    });

    it('should reset coordinator to VOLUNTEER', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: 'admin-id',
          organizationId: 'org-1',
          roleRef: { name: 'ORGANIZATION_ADMIN' },
        } as never)
        .mockResolvedValueOnce({
          id: 'coord-1',
          organizationId: 'org-1',
          roleRef: { name: 'COORDINATOR' },
        } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'vol-role-id',
        name: 'VOLUNTEER',
      } as never);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'coord-1',
        name: 'C',
        email: 'c@t.com',
        status: 'ACTIVE',
      } as never);

      await removeCoordinatorFromOrg('org-1', 'admin-id', 'coord-1');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ organizationId: null }) })
      );
    });
  });
});
