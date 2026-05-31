import { describe, expect, it } from 'vitest';

import { FeedbackSchema, UpdateFeedbackSchema } from '../schemas/feedback.schemas';

describe('feedback.schemas', () => {
  describe('FeedbackSchema', () => {
    it('should accept valid feedback with all fields', () => {
      const result = FeedbackSchema.safeParse({
        rating: 4,
        comments: 'Great event',
        learnings: 'Learned a lot',
        confidenceLevel: 3,
      });
      expect(result.success).toBe(true);
    });

    it('should accept feedback with only required fields', () => {
      const result = FeedbackSchema.safeParse({ rating: 5 });
      expect(result.success).toBe(true);
    });

    it('should reject rating below 1', () => {
      const result = FeedbackSchema.safeParse({ rating: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject rating above 5', () => {
      const result = FeedbackSchema.safeParse({ rating: 6 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer rating', () => {
      const result = FeedbackSchema.safeParse({ rating: 3.5 });
      expect(result.success).toBe(false);
    });

    it('should reject confidenceLevel below 1', () => {
      const result = FeedbackSchema.safeParse({ rating: 3, confidenceLevel: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject confidenceLevel above 5', () => {
      const result = FeedbackSchema.safeParse({ rating: 3, confidenceLevel: 6 });
      expect(result.success).toBe(false);
    });

    it('should reject comments over 1000 chars', () => {
      const result = FeedbackSchema.safeParse({ rating: 3, comments: 'x'.repeat(1001) });
      expect(result.success).toBe(false);
    });

    it('should reject learnings over 2000 chars', () => {
      const result = FeedbackSchema.safeParse({ rating: 3, learnings: 'x'.repeat(2001) });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateFeedbackSchema', () => {
    it('should accept partial update', () => {
      const result = UpdateFeedbackSchema.safeParse({ rating: 5 });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = UpdateFeedbackSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid rating', () => {
      const result = UpdateFeedbackSchema.safeParse({ rating: 7 });
      expect(result.success).toBe(false);
    });
  });
});
