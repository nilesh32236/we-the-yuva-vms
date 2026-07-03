import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    alertSubscription: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const { prisma } = await import('@/lib/prisma');

import {
  createSubscription,
  deleteSubscription,
  getMySubscriptions,
  updateSubscription,
} from '../alerts.service';

describe('alerts.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('should create subscription with provided categories/skills', async () => {
      vi.mocked(prisma.alertSubscription.create).mockResolvedValue({ id: 'sub-1' } as never);
      const _result = await createSubscription('user-1', {
        categories: ['EDUCATION'],
        skills: ['Teaching'],
      });
      expect(prisma.alertSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ categories: ['EDUCATION'] }) })
      );
    });
  });

  describe('updateSubscription', () => {
    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.alertSubscription.findUnique).mockResolvedValue(null);
      await expect(updateSubscription('sub-1', 'user-1', { isActive: false })).rejects.toThrow(
        'Not found'
      );
    });

    it('should update subscription successfully', async () => {
      vi.mocked(prisma.alertSubscription.findUnique).mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
      } as never);
      vi.mocked(prisma.alertSubscription.update).mockResolvedValue({
        id: 'sub-1',
        isActive: false,
      } as never);
      const result = await updateSubscription('sub-1', 'user-1', { isActive: false });
      expect(result.isActive).toBe(false);
    });
  });

  describe('getMySubscriptions', () => {
    it('should return subscriptions without pagination', async () => {
      vi.mocked(prisma.alertSubscription.findMany).mockResolvedValue([
        { id: 'sub-1', categories: ['EDUCATION'] },
      ] as never);
      const result = await getMySubscriptions('user-1');
      expect(result).toHaveLength(1);
      expect(prisma.alertSubscription.count).not.toHaveBeenCalled();
    });

    it('should return paginated subscriptions', async () => {
      vi.mocked(prisma.alertSubscription.findMany).mockResolvedValue([{ id: 'sub-1' }] as never);
      vi.mocked(prisma.alertSubscription.count).mockResolvedValue(1);
      const result = await getMySubscriptions('user-1', { page: 1, limit: 20 });
      expect(result.totalPages).toBe(1);
    });
  });

  describe('deleteSubscription', () => {
    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.alertSubscription.findUnique).mockResolvedValue(null);
      await expect(deleteSubscription('sub-1', 'user-1')).rejects.toThrow('Not found');
    });

    it('should delete subscription successfully', async () => {
      vi.mocked(prisma.alertSubscription.findUnique).mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
      } as never);
      vi.mocked(prisma.alertSubscription.delete).mockResolvedValue({ id: 'sub-1' } as never);
      const result = await deleteSubscription('sub-1', 'user-1');
      expect(result.id).toBe('sub-1');
    });
  });
});
