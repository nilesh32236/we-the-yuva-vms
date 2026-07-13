import { z } from 'zod';

export const CreateBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1, 'Content is required').max(10000),
  featuredImage: z.string().url('Must be a valid URL').optional(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  category: z.string().max(100).optional(),
});

export const UpdateBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1, 'Content is required').max(10000).optional(),
  featuredImage: z.string().url('Must be a valid URL').optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  category: z.string().max(100).optional(),
});
