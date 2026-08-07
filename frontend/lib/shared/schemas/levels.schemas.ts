import { z } from 'zod';

export const PeerEndorsementSchema = z.object({
  userId: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  statement: z.string().min(1).max(2000),
});

export const CreateLevelRequestSchema = z.object({
  proofUrls: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional(),
  proofData: z.record(z.unknown()).optional(),
  notes: z.string().max(1000).optional(),
  peerEndorsements: z.array(PeerEndorsementSchema).optional(),
});

export const ReviewLevelRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().max(1000).optional(),
});

export type CreateLevelRequestInput = z.infer<typeof CreateLevelRequestSchema>;
export type ReviewLevelRequestInput = z.infer<typeof ReviewLevelRequestSchema>;
