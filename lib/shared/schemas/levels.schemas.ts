import { z } from 'zod';

export const CreateLevelRequestSchema = z.object({
  proofUrls: z.array(z.string().url()).optional().default([]),
  videoUrl: z.string().url('Video URL must be a valid URL').optional(),
  proofData: z.record(z.unknown()).optional(),
  notes: z.string().min(1, 'Note cannot be empty').max(1000).optional(),
  peerEndorsements: z.record(z.unknown()).optional(),
});

export const ReviewLevelRequestSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED']),
    reviewNote: z.string().max(1000).optional(),
  })
  .refine((data) => data.status !== 'REJECTED' || (data.reviewNote && data.reviewNote.length > 0), {
    message: 'Review note is required when rejecting',
    path: ['reviewNote'],
  });

export type CreateLevelRequestInput = z.infer<typeof CreateLevelRequestSchema>;
export type ReviewLevelRequestInput = z.infer<typeof ReviewLevelRequestSchema>;
