import { z } from 'zod';

export const GetCourseSchema = z.object({}).optional();

export const CompleteLessonSchema = z
  .object({
    timeSpent: z.number().positive('Time spent must be a positive number').optional(),
    quizScore: z
      .number()
      .min(0, 'Score cannot be negative')
      .max(100, 'Score cannot exceed 100')
      .optional(),
  })
  .optional();

export const CreateCourseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['GENERAL', 'ORIENTATION', 'SAFETY', 'LEADERSHIP', 'SKILLS', 'OTHER']),
  isRequired: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const UpdateCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  category: z
    .enum(['GENERAL', 'ORIENTATION', 'SAFETY', 'LEADERSHIP', 'SKILLS', 'OTHER'])
    .optional(),
  isRequired: z.boolean().optional(),
  order: z.number().int('Order must be a whole number').optional(),
});

export const CreateLessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['TEXT', 'VIDEO', 'PDF']).optional(),
  mediaUrl: z.string().url('Must be a valid URL').optional(),
  order: z.number().int('Order must be a whole number').optional(),
});

export const UpdateLessonSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  type: z.enum(['TEXT', 'VIDEO', 'PDF']).optional(),
  mediaUrl: z.string().url('Must be a valid URL').optional(),
  order: z.number().int('Order must be a whole number').optional(),
});
