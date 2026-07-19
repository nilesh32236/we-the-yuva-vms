import { z } from 'zod';

export const AlertSubscriptionSchema = z.object({
  categories: z.array(z.string().min(1)).min(1).max(20).optional(),
  skills: z.array(z.string().min(1)).min(1).max(20).optional(),
}).refine((data) => data.categories || data.skills, {
  message: 'At least one of categories or skills must be provided',
});

export const AlertSubscriptionUpdateSchema = z.object({
  categories: z.array(z.string().min(1)).min(1).max(20).optional(),
  skills: z.array(z.string().min(1)).min(1).max(20).optional(),
  isActive: z.boolean().optional(),
});
