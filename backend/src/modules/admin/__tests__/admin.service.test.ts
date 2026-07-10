import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    role: { findUnique: vi.fn() },
    location: { upsert: vi.fn() },
    refreshToken: { updateMany: vi.fn() },
  },
}));

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));
vi.mock('@/lib/queue', () => ({
  notificationsQueue: { add: vi.fn().mockReturnValue(Promise.resolve({ id: 'job-1' })) },
}));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

const { prisma } = await import('@/lib/prisma');
const { logAudit } = await import('@/lib/audit');
const { notificationsQueue } = await import('@/lib/queue');

import { createUser, listUsers, updateUser } from '../admin.service';

describe('admin.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should throw 400 on invalid role', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null);
      await expect(
        createUser('admin-1', { name: 'U', email: 'u@t.com', role: 'FAKE' })
      ).rejects.toThrow('Invalid role');
    });

    it('should throw 409 on duplicate email', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'role-id',
        name: 'VOLUNTEER',
      } as never);
      vi.mocked(prisma.user.create).mockRejectedValue({ code: 'P2002' });
      await expect(
        createUser('admin-1', { name: 'U', email: 'dup@t.com', role: 'VOLUNTEER' })
      ).rejects.toThrow('Email already registered');
    });

    it('should create user successfully', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'role-id',
        name: 'VOLUNTEER',
      } as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user-1',
        name: 'U',
        email: 'u@t.com',
        roleId: 'role-id',
        status: 'ACTIVE',
      } as never);
      const result = await createUser('admin-1', {
        name: 'U',
        email: 'u@t.com',
        role: 'VOLUNTEER',
      });
      expect(result.id).toBe('user-1');
    });

    it('should create user with locationName', async () => {
      vi.mocked(prisma.location.upsert).mockResolvedValue({ id: 'loc-mumbai' } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'role-id',
        name: 'COORDINATOR',
      } as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user-1',
        name: 'U',
        email: 'u@t.com',
        roleId: 'role-id',
        status: 'ACTIVE',
      } as never);
      const result = await createUser('admin-1', {
        name: 'U',
        email: 'u@t.com',
        role: 'COORDINATOR',
        locationName: 'Mumbai',
      });
      expect(result.id).toBe('user-1');
      expect(prisma.location.upsert).toHaveBeenCalled();
    });
  });

  describe('listUsers', () => {
    it('should return paginated users', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      const result = await listUsers({}, { page: 1, limit: 20 });
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
    });

    it('should filter by role', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      await listUsers({ role: 'COORDINATOR' }, { page: 1, limit: 20 });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ roleRef: { name: 'COORDINATOR' } }),
        })
      );
    });

    it('should filter by status', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      await listUsers({ status: 'ACTIVE' }, { page: 1, limit: 20 });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) })
      );
    });

    it('should filter by search', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      await listUsers({ search: 'john' }, { page: 1, limit: 20 });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) })
      );
    });
  });

  describe('updateUser', () => {
    it('should throw 404 when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      await expect(updateUser('bad-id', { status: 'ACTIVE' })).rejects.toThrow('User not found');
    });

    it('should throw 400 on invalid role', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        roleId: 'role-id',
        status: 'ACTIVE',
      } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null);
      await expect(updateUser('user-1', { role: 'FAKE' })).rejects.toThrow('Invalid role');
    });

    it('should update user status and log USER_UPDATE audit', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        roleId: 'role-id',
        status: 'ACTIVE',
      } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'role-id',
        name: 'VOLUNTEER',
      } as never);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
        status: 'INACTIVE',
        roleId: 'role-id',
      } as never);

      const result = await updateUser('user-1', { status: 'INACTIVE' }, 'admin-1');
      expect(result.status).toBe('INACTIVE');
      expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_UPDATE' }));
    });

    it('should update role and log USER_CHANGE_ROLE audit', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        roleId: 'old-role-id',
        status: 'ACTIVE',
      } as never);
      // First call: lookup new role by name (COORDINATOR), second: lookup existing role by id
      vi.mocked(prisma.role.findUnique)
        .mockResolvedValueOnce({ id: 'new-role-id', name: 'COORDINATOR' } as never)
        .mockResolvedValueOnce({ id: 'old-role-id', name: 'VOLUNTEER' } as never);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
        roleId: 'new-role-id',
        status: 'ACTIVE',
      } as never);

      const result = await updateUser('user-1', { role: 'COORDINATOR' }, 'admin-1');
      expect(result).toBeDefined();
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USER_CHANGE_ROLE' })
      );
    });

    it('should revoke tokens and enqueue notification on SUSPENDED', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        roleId: 'role-id',
        status: 'ACTIVE',
        email: 'u@t.com',
      } as never);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'role-id',
        name: 'VOLUNTEER',
      } as never);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
        status: 'SUSPENDED',
        roleId: 'role-id',
        email: 'u@t.com',
      } as never);
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(notificationsQueue.add).mockResolvedValue({ id: 'job-1' } as never);

      const result = await updateUser('user-1', { status: 'SUSPENDED' }, 'admin-1');
      expect(result.status).toBe('SUSPENDED');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_SUSPEND' }));
      expect(notificationsQueue.add).toHaveBeenCalledWith(
        'account-suspended',
        expect.objectContaining({ userId: 'user-1' })
      );
    });
  });
});
