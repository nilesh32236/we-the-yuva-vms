import { z } from 'zod';

export const AlertSubscriptionSchema = z.object({
  categories: z.array(z.string().min(1)).max(20).optional(),
  skills: z.array(z.string().min(1)).max(20).optional(),
});

export const AlertSubscriptionUpdateSchema = z.object({
  categories: z.array(z.string().min(1)).max(20).optional(),
  skills: z.array(z.string().min(1)).max(20).optional(),
  isActive: z.boolean().optional(),
});
