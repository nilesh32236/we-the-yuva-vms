import { z } from 'zod';

export const CompleteLessonSchema = z
  .object({
    timeSpent: z.number().positive().optional(),
    quizScore: z.number().min(0).max(100).optional(),
  })
  .optional();

export const CreateCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  category: z.enum(['GENERAL', 'ORIENTATION', 'SAFETY', 'LEADERSHIP', 'SKILLS', 'OTHER']),
  isRequired: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const UpdateCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  description: z.string().min(1, 'Description is required').max(2000).optional(),
  category: z
    .enum(['GENERAL', 'ORIENTATION', 'SAFETY', 'LEADERSHIP', 'SKILLS', 'OTHER'])
    .optional(),
  isRequired: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const CreateLessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required').max(10000),
  type: z.enum(['TEXT', 'VIDEO', 'PDF']).optional(),
  mediaUrl: z.string().url('Must be a valid URL').optional(),
  order: z.number().int().optional(),
});

export const UpdateLessonSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  type: z.enum(['TEXT', 'VIDEO', 'PDF']).optional(),
  mediaUrl: z.string().url('Must be a valid URL').optional(),
  order: z.number().int().optional(),
});
