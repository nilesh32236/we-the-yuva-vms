import { describe, expect, it, vi } from 'vitest';

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn() },
  hash: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    organizationDocument: { create: vi.fn(), findMany: vi.fn() },
    user: { findUnique: vi.fn(), upsert: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    role: { findUnique: vi.fn() },
  },
}));

const { prisma } = await import('@/lib/prisma');

import {
  addCoordinatorToOrg,
  addOrganizationDocument,
  getOrganization,
  getOrganizationDocuments,
  listCoordinators,
  listOrganizations,
  registerOrganization,
  removeCoordinatorFromOrg,
  suspendOrganization,
  updateOrganization,
  verifyOrganization,
} from '../organizations.service';

describe('organizations.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerOrganization', () => {
    const input = { name: 'Test Org', description: 'A test org', email: 'org@test.com' };

    it('should throw 404 when admin user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      await expect(registerOrganization('user-1', input)).rejects.toThrow('User not found');
    });

    it('should throw 409 when user already belongs to an org', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: 'org-1',
        roleRef: { name: 'ORGANIZATION_ADMIN' },
      } as never);
      await expect(registerOrganization('user-1', input)).rejects.toThrow('already belongs');
    });

    it('should throw 403 when user is not ORGANIZATION_ADMIN', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: null,
        roleRef: { name: 'VOLUNTEER' },
      } as never);
      await expect(registerOrganization('user-1', input)).rejects.toThrow(
        'Only organization admins'
      );
    });

    it('should throw 409 when org name already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: null,
        roleRef: { name: 'ORGANIZATION_ADMIN' },
      } as never);
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'existing-org' } as never);
      await expect(registerOrganization('user-1', input)).rejects.toThrow('already exists');
    });

    it('should create organization with PENDING status', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: null,
        roleRef: { name: 'ORGANIZATION_ADMIN' },
      } as never);
      vi.mocked(prisma.organization.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.organization.create).mockResolvedValue({
        id: 'org-1',
        name: 'Test Org',
        status: 'PENDING',
        users: [{ id: 'user-1', name: 'Admin', email: 'admin@test.com' }],
      } as never);

      const org = await registerOrganization('user-1', input);
      expect(org.status).toBe('PENDING');
      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) })
      );
    });
  });

  describe('getOrganization', () => {
    it('should throw 404 when org not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
      await expect(getOrganization('bad-id')).rejects.toThrow('Organization not found');
    });

    it('should return organization with members and documents', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({
        id: 'org-1',
        name: 'Test Org',
        documents: [],
        users: [],
      } as never);
      const org = await getOrganization('org-1');
      expect(org.name).toBe('Test Org');
    });
  });

  describe('updateOrganization', () => {
    it('should throw 404 when org not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
      await expect(updateOrganization('bad-id', 'user-1', { name: 'New Name' })).rejects.toThrow(
        'Organization not found'
      );
    });

    it('should throw 403 when user lacks permission', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: null,
        roleRef: { name: 'VOLUNTEER' },
      } as never);
      await expect(updateOrganization('org-1', 'user-1', { name: 'New Name' })).rejects.toThrow(
        'Not authorized'
      );
    });

    it('should update organization successfully', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        organizationId: 'org-1',
        roleRef: { name: 'ORGANIZATION_ADMIN' },
      } as never);
      vi.mocked(prisma.organization.update).mockResolvedValue({
        id: 'org-1',
        name: 'Updated Name',
      } as never);
      const result = await updateOrganization('org-1', 'user-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('suspendOrganization', () => {
    it('should throw 404 when org not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
      await expect(suspendOrganization('bad-id')).rejects.toThrow('Organization not found');
    });

    it('should throw 400 if already suspended', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({
        id: 'org-1',
        status: 'SUSPENDED',
      } as never);
      await expect(suspendOrganization('org-1')).rejects.toThrow('already suspended');
    });

    it('should set status to SUSPENDED', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({
        id: 'org-1',
        status: 'ACTIVE',
      } as never);
      vi.mocked(prisma.organization.update).mockResolvedValue({
        id: 'org-1',
        status: 'SUSPENDED',
      } as never);
      const result = await suspendOrganization('org-1');
      expect(result.status).toBe('SUSPENDED');
    });
  });

  describe('verifyOrganization', () => {
    it('should throw 404 when org not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
      await expect(verifyOrganization('bad-id', true)).rejects.toThrow('Organization not found');
    });

    it('should throw 400 if not PENDING', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({
        id: 'org-1',
        status: 'ACTIVE',
      } as never);
      await expect(verifyOrganization('org-1', true)).rejects.toThrow('not in PENDING status');
    });

    it('should approve org with verifiedAt date', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({
        id: 'org-1',
        status: 'PENDING',
      } as never);
      vi.mocked(prisma.organization.update).mockResolvedValue({
        id: 'org-1',
        status: 'ACTIVE',
        verifiedAt: new Date(),
      } as never);
      const result = await verifyOrganization('org-1', true);
      expect(result.status).toBe('ACTIVE');
    });

    it('should reject org by setting SUSPENDED', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({
        id: 'org-1',
        status: 'PENDING',
      } as never);
      vi.mocked(prisma.organization.update).mockResolvedValue({
        id: 'org-1',
        status: 'SUSPENDED',
      } as never);
      const result = await verifyOrganization('org-1', false);
      expect(result.status).toBe('SUSPENDED');
    });
  });

  describe('listCoordinators', () => {
    it('should return coordinators for an org', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        {
          id: 'coord-1',
          name: 'Coord',
          email: 'coord@test.com',
          status: 'ACTIVE',
          createdAt: new Date(),
        },
      ] as never);
      const result = await listCoordinators('org-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Coord');
    });
  });

  describe('removeCoordinatorFromOrg', () => {
    it('should throw 404 when admin not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      await expect(removeCoordinatorFromOrg('org-1', 'admin-id', 'coord-id')).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw 403 when not authorized', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        organizationId: 'other-org',
        roleRef: { name: 'VOLUNTEER' },
      } as never);
      await expect(removeCoordinatorFromOrg('org-1', 'user-1', 'coord-id')).rejects.toThrow(
        'Unauthorized to remove coordinators'
      );
    });

    it('should throw 404 when coordinator not found in this org', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          organizationId: 'org-1',
          roleRef: { name: 'ORGANIZATION_ADMIN' },
        } as never)
        .mockResolvedValueOnce(null);
      await expect(removeCoordinatorFromOrg('org-1', 'admin-id', 'coord-id')).rejects.toThrow(
        'Coordinator not found in this organization'
      );
    });

    it('should throw 400 when user is not a coordinator', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          organizationId: 'org-1',
          roleRef: { name: 'ORGANIZATION_ADMIN' },
        } as never)
        .mockResolvedValueOnce({
          organizationId: 'org-1',
          roleRef: { name: 'VOLUNTEER' },
        } as never);
      await expect(removeCoordinatorFromOrg('org-1', 'admin-id', 'vol-id')).rejects.toThrow(
        'User is not a coordinator'
      );
    });

    it('should throw 500 when VOLUNTEER role not found', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          organizationId: 'org-1',
          roleRef: { name: 'ORGANIZATION_ADMIN' },
        } as never)
        .mockResolvedValueOnce({
          organizationId: 'org-1',
          roleRef: { name: 'COORDINATOR' },
        } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null);
      await expect(removeCoordinatorFromOrg('org-1', 'admin-id', 'coord-id')).rejects.toThrow(
        'VOLUNTEER role not found'
      );
    });

    it('should reset coordinator to VOLUNTEER role', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          organizationId: 'org-1',
          roleRef: { name: 'ORGANIZATION_ADMIN' },
        } as never)
        .mockResolvedValueOnce({
          organizationId: 'org-1',
          roleRef: { name: 'COORDINATOR' },
        } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'vol-role-id',
        name: 'VOLUNTEER',
      } as never);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'coord-id',
        name: 'Coord',
        email: 'coord@test.com',
        status: 'ACTIVE',
      } as never);

      const result = await removeCoordinatorFromOrg('org-1', 'admin-id', 'coord-id');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ organizationId: null }) })
      );
      expect(result).toBeDefined();
    });
  });

  describe('listOrganizations', () => {
    it('should return paginated orgs', async () => {
      vi.mocked(prisma.organization.findMany).mockResolvedValue([
        { id: 'org-1', name: 'Test Org' },
      ] as never);
      vi.mocked(prisma.organization.count).mockResolvedValue(1);
      const result = await listOrganizations({ page: 1, limit: 20 });
      expect(result.orgs).toHaveLength(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      vi.mocked(prisma.organization.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.organization.count).mockResolvedValue(0);
      await listOrganizations({ status: 'ACTIVE', page: 1, limit: 20 });
      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'ACTIVE' } })
      );
    });
  });

  describe('addOrganizationDocument', () => {
    it('should throw 404 when org not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
      await expect(
        addOrganizationDocument('bad-id', 'doc.pdf', 'https://url', 'PAN')
      ).rejects.toThrow('Organization not found');
    });

    it('should create document', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.organizationDocument.create).mockResolvedValue({
        id: 'doc-1',
        fileName: 'doc.pdf',
      } as never);
      const result = await addOrganizationDocument('org-1', 'doc.pdf', 'https://url', 'PAN');
      expect(result.fileName).toBe('doc.pdf');
    });
  });

  describe('getOrganizationDocuments', () => {
    it('should throw 404 when org not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
      await expect(getOrganizationDocuments('bad-id')).rejects.toThrow('Organization not found');
    });

    it('should return documents', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.organizationDocument.findMany).mockResolvedValue([
        { id: 'doc-1', fileName: 'doc.pdf' },
      ] as never);
      const result = await getOrganizationDocuments('org-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('addCoordinatorToOrg', () => {
    it('should throw 404 when org not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
      await expect(
        addCoordinatorToOrg('bad-id', 'admin-id', { name: 'C', email: 'c@t.com' })
      ).rejects.toThrow('Organization not found');
    });

    it('should add coordinator with role', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'admin-id',
        organizationId: 'org-1',
        roleRef: { name: 'ORGANIZATION_ADMIN' },
      } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'coord-role-id',
        name: 'COORDINATOR',
      } as never);
      vi.mocked(prisma.user.upsert).mockResolvedValue({ id: 'coord-1', name: 'C' } as never);
      const result = await addCoordinatorToOrg('org-1', 'admin-id', {
        name: 'C',
        email: 'c@t.com',
      });
      expect(result).toBeDefined();
    });
  });
});
