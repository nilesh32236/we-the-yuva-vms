import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    blogPost: {
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
vi.mock('slugify', () => ({ default: (s: string) => s.toLowerCase().replace(/\s+/g, '-') }));

const { prisma } = await import('@/lib/prisma');
const {
  createPost, getPublishedPosts, getPostBySlug, getPostById,
  updatePost, publishPost, archivePost, deletePost, listAllPosts,
} = await import('../blog.service');

describe('blog.service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('createPost', () => {
    it('should create a post with generated slug', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.blogPost.create).mockResolvedValue({
        id: 'p1', title: 'Hello World', slug: 'hello-world',
        excerpt: null, content: 'Content', featuredImage: null,
        tags: ['tech'], category: null, status: 'DRAFT',
        authorId: 'u1', publishedAt: null, createdAt: new Date(), updatedAt: new Date(),
      } as never);
      const result = await createPost('u1', { title: 'Hello World', content: 'Content', tags: ['tech'] });
      expect(result.slug).toBe('hello-world');
      expect(prisma.blogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'hello-world' }) })
      );
    });
  });

  describe('getPublishedPosts', () => {
    it('should return paginated published posts', async () => {
      vi.mocked(prisma.blogPost.findMany).mockResolvedValue([]);
      vi.mocked(prisma.blogPost.count).mockResolvedValue(0);
      const result = await getPublishedPosts(1, 20);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getPostBySlug', () => {
    it('should throw 404 for unknown slug', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);
      await expect(getPostBySlug('bad-slug')).rejects.toThrow('Post not found');
    });
  });

  describe('getPostById', () => {
    it('should throw 404 for unknown id', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);
      await expect(getPostById('bad-id')).rejects.toThrow('Post not found');
    });
  });

  describe('updatePost', () => {
    it('should throw 404 if post not found', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);
      await expect(updatePost('bad-id', 'u1', { title: 'New' }, 'VOLUNTEER')).rejects.toThrow('Post not found');
    });
    it('should throw 403 if not author and not admin', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        id: 'p1', authorId: 'other-user',
      } as never);
      await expect(updatePost('p1', 'u1', { title: 'New' }, 'VOLUNTEER')).rejects.toThrow('Forbidden');
    });
    it('should allow admin to update any post', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        id: 'p1', authorId: 'other-user',
      } as never);
      vi.mocked(prisma.blogPost.update).mockResolvedValue({ id: 'p1' } as never);
      const result = await updatePost('p1', 'admin', { title: 'New' }, 'ADMIN');
      expect(result).toBeDefined();
    });
  });

  describe('publishPost', () => {
    it('should throw 403 if not admin', async () => {
      await expect(publishPost('p1', 'u1', 'VOLUNTEER')).rejects.toThrow('Forbidden');
    });
    it('should publish successfully', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({ id: 'p1', status: 'DRAFT' } as never);
      vi.mocked(prisma.blogPost.update).mockResolvedValue({ id: 'p1', status: 'PUBLISHED' } as never);
      const result = await publishPost('p1', 'admin', 'ADMIN');
      expect(result.status).toBe('PUBLISHED');
    });
  });

  describe('archivePost', () => {
    it('should throw 403 if not admin', async () => {
      await expect(archivePost('p1', 'u1', 'VOLUNTEER')).rejects.toThrow('Forbidden');
    });
    it('should archive successfully', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({ id: 'p1', status: 'PUBLISHED' } as never);
      vi.mocked(prisma.blogPost.update).mockResolvedValue({ id: 'p1', status: 'ARCHIVED' } as never);
      const result = await archivePost('p1', 'admin', 'ADMIN');
      expect(result.status).toBe('ARCHIVED');
    });
  });

  describe('deletePost', () => {
    it('should throw 404 if not found', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);
      await expect(deletePost('bad-id', 'u1', 'ADMIN')).rejects.toThrow('Post not found');
    });
    it('should allow admin to delete any post', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({ id: 'p1', authorId: 'other' } as never);
      await deletePost('p1', 'admin', 'ADMIN');
      expect(prisma.blogPost.delete).toHaveBeenCalled();
    });
  });

  describe('listAllPosts', () => {
    it('should return all posts', async () => {
      vi.mocked(prisma.blogPost.findMany).mockResolvedValue([]);
      vi.mocked(prisma.blogPost.count).mockResolvedValue(0);
      const result = await listAllPosts();
      expect(result.data).toEqual([]);
    });
  });
});
