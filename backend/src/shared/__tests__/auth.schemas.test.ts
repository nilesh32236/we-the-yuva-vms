import { describe, expect, it } from 'vitest';

import {
  ConsentSchema,
  RegisterSchema,
  SendOtpSchema,
  VerifyOtpSchema,
} from '../schemas/auth.schemas';

describe('auth.schemas', () => {
  describe('RegisterSchema', () => {
    const validPayload = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+919876543210',
      dateOfBirth: '2000-01-15',
      address: { city: 'Mumbai', state: 'Maharashtra' },
    };

    it('should accept valid registration with required fields', () => {
      const result = RegisterSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, name: 'A' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, email: 'not-email' });
      expect(result.success).toBe(false);
    });

    it('should reject missing phone', () => {
      const { phone, ...noPhone } = validPayload;
      const result = RegisterSchema.safeParse(noPhone);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone format', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, phone: 'abc' });
      expect(result.success).toBe(false);
    });

    it('should reject date of birth for under 14 years old', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, dateOfBirth: '2020-06-15' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid date string', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, dateOfBirth: 'not-a-date' });
      expect(result.success).toBe(false);
    });

    it('should reject missing address', () => {
      const { address, ...noAddr } = validPayload;
      const result = RegisterSchema.safeParse(noAddr);
      expect(result.success).toBe(false);
    });

    it('should reject address without city', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        address: { state: 'Maharashtra' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject address without state', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        address: { city: 'Mumbai' },
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid reference', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, reference: '+919876543210' });
      expect(result.success).toBe(true);
    });

    it('should accept callAvailability with anytime preference', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        callAvailability: { preference: 'anytime' },
      });
      expect(result.success).toBe(true);
    });

    it('should accept callAvailability with specific_days', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        callAvailability: { preference: 'specific_days', days: [1, 3, 5] },
      });
      expect(result.success).toBe(true);
    });

    it('should accept callAvailability with custom slots', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        callAvailability: {
          preference: 'custom',
          slots: [{ day: 1, startTime: '09:00', endTime: '12:00' }],
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject whyVoluntary over 500 characters', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        whyVoluntary: 'x'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should accept whyVoluntary within 500 characters', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        whyVoluntary: 'I want to make a difference in my community.',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional fields as undefined', () => {
      const result = RegisterSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reference).toBeUndefined();
        expect(result.data.callAvailability).toBeUndefined();
        expect(result.data.whyVoluntary).toBeUndefined();
      }
    });
  });

  describe('SendOtpSchema', () => {
    it('should accept valid OTP request', () => {
      const result = SendOtpSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(true);
    });
  });

  describe('VerifyOtpSchema', () => {
    it('should accept valid OTP verification', () => {
      const result = VerifyOtpSchema.safeParse({ email: 'test@example.com', otp: '123456' });
      expect(result.success).toBe(true);
    });

    it('should reject short OTP', () => {
      const result = VerifyOtpSchema.safeParse({ email: 'test@example.com', otp: '12345' });
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric OTP', () => {
      const result = VerifyOtpSchema.safeParse({ email: 'test@example.com', otp: 'abc123' });
      expect(result.success).toBe(false);
    });
  });

  describe('ConsentSchema', () => {
    it('should accept consent with required fields', () => {
      const result = ConsentSchema.safeParse({
        privacyPolicyAccepted: true,
        mediaConsentAccepted: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject consent without privacyPolicyAccepted', () => {
      const result = ConsentSchema.safeParse({ mediaConsentAccepted: true });
      expect(result.success).toBe(false);
    });
  });
});
