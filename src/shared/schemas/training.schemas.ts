import { z } from 'zod';

export const GetCourseSchema = z.object({}).optional();

export const CompleteLessonSchema = z
  .object({
    timeSpent: z.number().positive().optional(),
    quizScore: z.number().min(0).max(100).optional(),
  })
  .optional();
