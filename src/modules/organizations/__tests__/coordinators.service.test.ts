import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    user: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    role: { findUnique: vi.fn() },
  },
}));

const { prisma } = await import('@/lib/prisma');

import { addCoordinator, listCoordinators, removeCoordinator } from '../coordinators.service';

describe('coordinators.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addCoordinator', () => {
    it('should throw 404 when org not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
      await expect(
        addCoordinator('org-1', 'caller-id', { name: 'C', email: 'c@t.com' })
      ).rejects.toThrow('Organization not found');
    });

    it('should create coordinator user', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: 'org-1',
        roleRef: { name: 'ORGANIZATION_ADMIN' },
      } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'coord-role-id',
        name: 'COORDINATOR',
      } as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'coord-1',
        name: 'C',
        email: 'c@t.com',
        status: 'ACTIVE',
        createdAt: new Date(),
      } as never);

      const result = await addCoordinator('org-1', 'caller-id', { name: 'C', email: 'c@t.com' });
      expect(result.id).toBe('coord-1');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'c@t.com', organizationId: 'org-1' }),
        })
      );
    });

    it('should throw 409 on duplicate email', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: 'org-1',
        roleRef: { name: 'ORGANIZATION_ADMIN' },
      } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'coord-role-id',
        name: 'COORDINATOR',
      } as never);
      vi.mocked(prisma.user.create).mockRejectedValue({ code: 'P2002' });

      await expect(
        addCoordinator('org-1', 'caller-id', { name: 'C', email: 'dup@t.com' })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('listCoordinators', () => {
    it('should list coordinators for an org', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'coord-role-id',
        name: 'COORDINATOR',
      } as never);
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'c1', name: 'C1', email: 'c1@t.com', status: 'ACTIVE', createdAt: new Date() },
      ] as never);

      const result = await listCoordinators('org-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('removeCoordinator', () => {
    it('should throw 404 when org not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
      await expect(removeCoordinator('org-1', 'coord-1', 'caller-id')).rejects.toThrow(
        'Organization not found'
      );
    });

    it('should throw 404 when caller not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      await expect(removeCoordinator('org-1', 'coord-1', 'caller-id')).rejects.toThrow(
        'Caller not found'
      );
    });

    it('should throw 403 when not authorized', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: 'other-org',
        roleRef: { name: 'VOLUNTEER' },
      } as never);
      await expect(removeCoordinator('org-1', 'coord-1', 'caller-id')).rejects.toThrow(
        'Not authorized to remove coordinators'
      );
    });

    it('should throw 404 when coordinator not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          organizationId: 'org-1',
          roleRef: { name: 'ORGANIZATION_ADMIN' },
        } as never)
        .mockResolvedValueOnce(null);
      await expect(removeCoordinator('org-1', 'coord-1', 'caller-id')).rejects.toThrow(
        'Coordinator not found'
      );
    });

    it('should throw 400 when user is not in this org', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          organizationId: 'org-1',
          roleRef: { name: 'ORGANIZATION_ADMIN' },
        } as never)
        .mockResolvedValueOnce({
          id: 'coord-1',
          organizationId: 'other-org',
        } as never);
      await expect(removeCoordinator('org-1', 'coord-1', 'caller-id')).rejects.toThrow(
        'not a coordinator of this organization'
      );
    });

    it('should throw 500 when VOLUNTEER role not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          organizationId: 'org-1',
          roleRef: { name: 'ORGANIZATION_ADMIN' },
        } as never)
        .mockResolvedValueOnce({
          id: 'coord-1',
          organizationId: 'org-1',
          roleRef: { name: 'COORDINATOR' },
        } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null);
      await expect(removeCoordinator('org-1', 'coord-1', 'caller-id')).rejects.toThrow(
        'VOLUNTEER role not found'
      );
    });

    it('should reset coordinator to VOLUNTEER', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
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

      const _result = await removeCoordinator('org-1', 'coord-1', 'caller-id');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ organizationId: null }) })
      );
    });
  });
});
