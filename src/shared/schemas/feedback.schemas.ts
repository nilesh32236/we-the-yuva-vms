import { z } from 'zod';

export const FeedbackSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comments: z.string().max(1000, 'Comments too long').optional(),
  learnings: z.string().max(2000, 'Learnings too long').optional(),
  confidenceLevel: z.number().int().min(1).max(5).optional(),
});
