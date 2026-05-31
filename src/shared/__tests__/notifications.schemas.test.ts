import { describe, expect, it } from 'vitest';

import {
  NotificationPreferenceSchema,
  PushSubscriptionSchema,
  PushUnsubscribeSchema,
} from '../schemas/notifications.schemas';

describe('notifications.schemas', () => {
  describe('PushSubscriptionSchema', () => {
    it('should accept valid subscription', () => {
      const result = PushSubscriptionSchema.safeParse({
        endpoint: 'https://fcm.googleapis.com/test',
        keys: { p256dh: 'key123', auth: 'auth456' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid endpoint', () => {
      const result = PushSubscriptionSchema.safeParse({
        endpoint: 'not-a-url',
        keys: { p256dh: 'key123', auth: 'auth456' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty p256dh', () => {
      const result = PushSubscriptionSchema.safeParse({
        endpoint: 'https://example.com',
        keys: { p256dh: '', auth: 'auth456' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty auth', () => {
      const result = PushSubscriptionSchema.safeParse({
        endpoint: 'https://example.com',
        keys: { p256dh: 'key123', auth: '' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('PushUnsubscribeSchema', () => {
    it('should accept valid endpoint', () => {
      const result = PushUnsubscribeSchema.safeParse({
        endpoint: 'https://fcm.googleapis.com/test',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid endpoint', () => {
      const result = PushUnsubscribeSchema.safeParse({
        endpoint: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('NotificationPreferenceSchema', () => {
    it('should accept empty input', () => {
      const result = NotificationPreferenceSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept email preference', () => {
      const result = NotificationPreferenceSchema.safeParse({ email: true });
      expect(result.success).toBe(true);
    });

    it('should accept push preference', () => {
      const result = NotificationPreferenceSchema.safeParse({ push: false });
      expect(result.success).toBe(true);
    });

    it('should accept both preferences', () => {
      const result = NotificationPreferenceSchema.safeParse({ email: true, push: true });
      expect(result.success).toBe(true);
    });
  });
});
