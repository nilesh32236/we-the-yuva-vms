import { z } from 'zod';

const mediaUrl = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.union([z.string().url(), z.string().startsWith('/')]).optional()
);

export const CreateStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  mediaUrl,
});

export const UpdateStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long').optional(),
  mediaUrl,
});

export const ModerateStorySchema = z.object({
  published: z.boolean(),
});
