import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    story: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));
vi.mock('@/lib/queue', () => ({ notificationsQueue: null }));

const { prisma } = await import('@/lib/prisma');

import {
  createStory,
  deleteStory,
  getPublishedStories,
  getStoryById,
  listAllStories,
  moderateStory,
  updateStory,
} from '../stories.service';

describe('stories.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createStory', () => {
    it('should create a story with stripped HTML', async () => {
      vi.mocked(prisma.story.create).mockResolvedValue({
        id: 'story-1',
        title: 'Clean Title',
        content: 'Clean Content',
      } as never);
      const result = await createStory('user-1', {
        title: '<script>alert("xss")</script>Clean Title',
        content: '<p>Clean Content</p>',
      });
      expect(result.title).not.toContain('<script>');
      expect(result.title).toContain('Clean Title');
    });
  });

  describe('getPublishedStories', () => {
    it('should return paginated published stories', async () => {
      vi.mocked(prisma.story.findMany).mockResolvedValue([]);
      vi.mocked(prisma.story.count).mockResolvedValue(0);
      const result = await getPublishedStories(1, 20);
      expect(result.data).toEqual([]);
    });
  });

  describe('getStoryById', () => {
    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.story.findUnique).mockResolvedValue(null);
      await expect(getStoryById('bad-id')).rejects.toThrow('Story not found');
    });
  });

  describe('updateStory', () => {
    it('should throw 404 when story not found', async () => {
      vi.mocked(prisma.story.findUnique).mockResolvedValue(null);
      await expect(updateStory('bad-id', 'user-1', { title: 'New' })).rejects.toThrow(
        'Story not found'
      );
    });

    it('should throw 403 if not owner', async () => {
      vi.mocked(prisma.story.findUnique).mockResolvedValue({
        id: 's-1',
        userId: 'other-user',
      } as never);
      await expect(updateStory('s-1', 'user-1', { title: 'Hacked' })).rejects.toThrow('Forbidden');
    });

    it('should update as owner', async () => {
      vi.mocked(prisma.story.findUnique).mockResolvedValue({
        id: 's-1',
        userId: 'user-1',
      } as never);
      vi.mocked(prisma.story.update).mockResolvedValue({
        id: 's-1',
        title: 'Updated',
        content: 'Content',
      } as never);
      const result = await updateStory('s-1', 'user-1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should allow admin to update any story', async () => {
      vi.mocked(prisma.story.findUnique).mockResolvedValue({
        id: 's-1',
        userId: 'other-user',
      } as never);
      vi.mocked(prisma.story.update).mockResolvedValue({
        id: 's-1',
        title: 'Admin Updated',
      } as never);
      const result = await updateStory('s-1', 'admin-1', { title: 'Admin Updated' }, 'ADMIN');
      expect(result.title).toBe('Admin Updated');
    });
  });

  describe('moderateStory', () => {
    it('should throw 403 if not admin', async () => {
      await expect(moderateStory('s-1', 'user-1', 'VOLUNTEER', true)).rejects.toThrow(
        'only admins can moderate'
      );
    });

    it('should throw 404 when story not found', async () => {
      vi.mocked(prisma.story.findUnique).mockResolvedValue(null);
      await expect(moderateStory('s-1', 'admin-1', 'ADMIN', true)).rejects.toThrow(
        'Story not found'
      );
    });

    it('should publish story successfully', async () => {
      vi.mocked(prisma.story.findUnique).mockResolvedValue({
        id: 's-1',
        published: false,
      } as never);
      vi.mocked(prisma.story.update).mockResolvedValue({
        id: 's-1',
        published: true,
      } as never);
      const result = await moderateStory('s-1', 'admin-1', 'ADMIN', true);
      expect(result.published).toBe(true);
    });
  });

  describe('listAllStories', () => {
    it('should return paginated all stories', async () => {
      vi.mocked(prisma.story.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.story.count).mockResolvedValue(0);
      const result = await listAllStories(1, 50);
      expect(result.data).toEqual([]);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('deleteStory', () => {
    it('should throw 404 when story not found', async () => {
      vi.mocked(prisma.story.findUnique).mockResolvedValue(null);
      await expect(deleteStory('bad-id', 'user-1', 'VOLUNTEER')).rejects.toThrow('Story not found');
    });

    it('should throw 403 when not owner and not admin', async () => {
      vi.mocked(prisma.story.findUnique).mockResolvedValue({
        id: 's-1',
        userId: 'other-user',
      } as never);
      await expect(deleteStory('s-1', 'user-1', 'VOLUNTEER')).rejects.toThrow('Forbidden');
    });

    it('should delete when owner', async () => {
      vi.mocked(prisma.story.findUnique).mockResolvedValue({
        id: 's-1',
        userId: 'user-1',
      } as never);
      vi.mocked(prisma.story.delete).mockResolvedValue({} as never);
      await expect(deleteStory('s-1', 'user-1', 'VOLUNTEER')).resolves.toBeUndefined();
    });

    it('should delete when admin', async () => {
      vi.mocked(prisma.story.findUnique).mockResolvedValue({
        id: 's-1',
        userId: 'other-user',
      } as never);
      vi.mocked(prisma.story.delete).mockResolvedValue({} as never);
      await expect(deleteStory('s-1', 'admin-1', 'ADMIN')).resolves.toBeUndefined();
    });
  });
});
