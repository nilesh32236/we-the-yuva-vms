import { z } from 'zod';

// Optional number fields that forms may submit as an empty string — coerce
// would turn '' into 0 and fail the range check, so normalize '' to undefined.
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

const feedbackRating = z.coerce.number().finite().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5');

export const FeedbackSchema = z.object({
  rating: feedbackRating,
  comments: z.string().max(1000, 'Comments too long').optional(),
  learnings: z.string().max(2000, 'Learnings too long').optional(),
  confidenceLevel: optionalNumber(z.coerce.number().finite().int().min(1).max(5)),
});

export const UpdateFeedbackSchema = z.object({
  rating: optionalNumber(feedbackRating),
  comments: z.string().max(1000, 'Comments too long').optional(),
  learnings: z.string().max(2000, 'Learnings too long').optional(),
  confidenceLevel: optionalNumber(z.coerce.number().finite().int().min(1).max(5)),
});
