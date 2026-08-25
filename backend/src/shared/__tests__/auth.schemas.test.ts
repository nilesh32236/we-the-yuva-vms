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
      whatsappNumber: '+919876543210',
      gender: 'MALE' as const,
      dateOfBirth: '2000-01-15',
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

    it('should reject missing whatsappNumber', () => {
      const { whatsappNumber, ...noWhatsapp } = validPayload;
      const result = RegisterSchema.safeParse(noWhatsapp);
      expect(result.success).toBe(false);
    });

    it('should reject invalid whatsappNumber format', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, whatsappNumber: 'abc' });
      expect(result.success).toBe(false);
    });

    it('should reject missing gender', () => {
      const { gender, ...noGender } = validPayload;
      const result = RegisterSchema.safeParse(noGender);
      expect(result.success).toBe(false);
    });

    it('should reject invalid gender', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, gender: 'INVALID' as never });
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

    it('should accept valid registration without optional role', () => {
      const result = RegisterSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBeUndefined();
      }
    });

    it('should accept VOLUNTEER role', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, role: 'VOLUNTEER' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, role: 'INVALID' as never });
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
