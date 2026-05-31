import { z } from 'zod';
import { VOLUNTEER_TYPES } from './profile.schemas';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Please enter a valid email address'),
  volunteerType: z.enum(VOLUNTEER_TYPES).optional(),
});

export const SendOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const ConsentSchema = z.object({
  privacyPolicyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the privacy policy to continue' }),
  }),
  mediaConsentAccepted: z.boolean(),
});
