import { z } from 'zod';

export const StartChallengeSchema = z.object({
  acts: z.array(z.string().trim().min(1).max(120)).min(1, 'Select at least one act').max(20),
  // Custom "Other" act text arrives pre-merged into acts[] by the client
  startDate: z.coerce.date(),
});

export const LinkStorySchema = z.object({
  storyId: z.string().trim().min(1),
});

export const AdminChallengeQuerySchema = z.object({
  query: z.object({
    status: z.enum(['ACTIVE', 'COMPLETED']).optional(),
    source: z
      .enum(['FRIEND', 'COLLEGE', 'PARTNER_ORG', 'SOCIAL_MEDIA', 'WEBSITE', 'CURRENT_VOLUNTEER', 'NEWSPAPER', 'EVENT', 'OTHER'])
      .optional(),
  }),
});
