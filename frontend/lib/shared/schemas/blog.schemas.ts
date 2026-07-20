import { z } from 'zod';

const ContentSchema = z.string().min(1, 'Content is required').max(50000, 'Content too long').refine(
  (val) => val.replace(/<[^>]*>/g, '').trim().length > 0,
  { message: 'Content is required' },
);

export const CreateBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  excerpt: z.string().max(500).optional(),
  content: ContentSchema,
  featuredImage: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  category: z.string().max(100).optional(),
});

export const UpdateBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  excerpt: z.string().max(500).optional(),
  content: ContentSchema.optional(),
  featuredImage: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  category: z.string().max(100).optional(),
});
