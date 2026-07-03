import { z } from 'zod';

export const CreateMentorshipSchema = z.object({
  menteeId: z.string().min(1, 'Mentee ID is required'),
  message: z.string().optional(),
});

export const ReviewMentorshipSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED']),
});

export type CreateMentorshipInput = z.infer<typeof CreateMentorshipSchema>;
export type ReviewMentorshipInput = z.infer<typeof ReviewMentorshipSchema>;
