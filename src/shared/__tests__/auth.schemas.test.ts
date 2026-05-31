import { describe, expect, it } from 'vitest';

import {
  ConsentSchema,
  RegisterSchema,
  SendOtpSchema,
  VerifyOtpSchema,
} from '../schemas/auth.schemas';

describe('auth.schemas', () => {
  describe('RegisterSchema', () => {
    it('should accept valid registration', () => {
      const result = RegisterSchema.safeParse({ name: 'Test', email: 'test@example.com' });
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const result = RegisterSchema.safeParse({ name: 'A', email: 'test@example.com' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = RegisterSchema.safeParse({ name: 'Test', email: 'not-email' });
      expect(result.success).toBe(false);
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
