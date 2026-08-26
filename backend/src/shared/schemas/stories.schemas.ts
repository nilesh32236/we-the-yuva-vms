import { z } from 'zod';

export const CreateStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  mediaUrl: z.union([z.string().url(), z.string().startsWith('/')]).optional(),
  challengeId: z.string().trim().min(1).optional(),
  kindnessChallengeId: z.string().trim().min(1).optional(),
  kindnessDay: z.coerce.number().int().min(1).max(7).optional(),
  isCompletion: z.boolean().optional().default(false),
});

export const UpdateStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long').optional(),
  mediaUrl: z.union([z.string().url(), z.string().startsWith('/')]).optional(),
});

export const ModerateStorySchema = z.object({
  published: z.boolean(),
});
