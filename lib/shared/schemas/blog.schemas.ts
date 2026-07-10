import { z } from 'zod';

export const CreateBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format')
    .optional(),
  excerpt: z.string().max(500, 'Excerpt too long, maximum 500 characters').optional(),
  content: z.string().min(1, 'Content is required'),
  featuredImage: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
  tags: z
    .array(z.string().max(50, 'Tag too long'))
    .max(20, 'Maximum 20 tags')
    .optional()
    .default([]),
  category: z.string().max(100, 'Category too long').optional(),
});

export const UpdateBlogPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be under 200 characters')
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format')
    .optional(),
  excerpt: z.string().max(500, 'Excerpt too long, maximum 500 characters').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  featuredImage: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
  tags: z
    .array(z.string().max(50, 'Tag too long'))
    .max(20, 'Maximum 20 tags')
    .optional()
    .default([]),
  category: z.string().max(100, 'Category too long').optional(),
});
