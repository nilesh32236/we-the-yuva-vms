import { z } from 'zod';

export const CreateStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  mediaUrl: z
    .union([
      z.string().url('Media URL must be a valid URL or a relative path starting with /'),
      z
        .string()
        .startsWith('/', 'Media URL must be a valid URL or a relative path starting with /'),
    ])
    .optional(),
});

export const UpdateStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long').optional(),
  mediaUrl: z
    .union([
      z.string().url('Media URL must be a valid URL or a relative path starting with /'),
      z
        .string()
        .startsWith('/', 'Media URL must be a valid URL or a relative path starting with /'),
    ])
    .optional(),
});

export const ModerateStorySchema = z.object({
  published: z.boolean(),
});
