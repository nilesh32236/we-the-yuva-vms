import { describe, expect, it } from 'vitest';

import { AlertSubscriptionSchema, AlertSubscriptionUpdateSchema } from '../schemas/alerts.schemas';

describe('alerts.schemas', () => {
  describe('AlertSubscriptionSchema', () => {
    it('should accept empty input', () => {
      const result = AlertSubscriptionSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept with categories', () => {
      const result = AlertSubscriptionSchema.safeParse({
        categories: ['EDUCATION', 'HEALTH'],
      });
      expect(result.success).toBe(true);
    });

    it('should accept with skills', () => {
      const result = AlertSubscriptionSchema.safeParse({
        skills: ['Teaching', 'Mentoring'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty string in categories', () => {
      const result = AlertSubscriptionSchema.safeParse({
        categories: [''],
      });
      expect(result.success).toBe(false);
    });

    it('should reject over 20 categories', () => {
      const result = AlertSubscriptionSchema.safeParse({
        categories: Array.from({ length: 21 }, (_, i) => `cat-${i}`),
      });
      expect(result.success).toBe(false);
    });

    it('should reject over 20 skills', () => {
      const result = AlertSubscriptionSchema.safeParse({
        skills: Array.from({ length: 21 }, (_, i) => `skill-${i}`),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AlertSubscriptionUpdateSchema', () => {
    it('should accept empty input', () => {
      const result = AlertSubscriptionUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept isActive', () => {
      const result = AlertSubscriptionUpdateSchema.safeParse({ isActive: false });
      expect(result.success).toBe(true);
    });

    it('should accept categories update', () => {
      const result = AlertSubscriptionUpdateSchema.safeParse({
        categories: ['ENVIRONMENT'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty category string', () => {
      const result = AlertSubscriptionUpdateSchema.safeParse({
        categories: [''],
      });
      expect(result.success).toBe(false);
    });
  });
});
