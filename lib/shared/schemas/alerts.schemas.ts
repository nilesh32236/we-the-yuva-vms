import { z } from 'zod';

export const AlertSubscriptionSchema = z.object({
  categories: z
    .array(z.string().min(1, 'Category is required'))
    .max(20, 'Maximum 20 categories allowed')
    .optional(),
  skills: z
    .array(z.string().min(1, 'Skill is required'))
    .max(20, 'Maximum 20 skills allowed')
    .optional(),
});

export const AlertSubscriptionUpdateSchema = z.object({
  categories: z
    .array(z.string().min(1, 'Category is required'))
    .max(20, 'Maximum 20 categories allowed')
    .optional(),
  skills: z
    .array(z.string().min(1, 'Skill is required'))
    .max(20, 'Maximum 20 skills allowed')
    .optional(),
  isActive: z.boolean().optional().default(true),
});
