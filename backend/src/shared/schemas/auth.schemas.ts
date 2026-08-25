import { z } from 'zod';

const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;

// Accept YYYY-MM-DD and reject values JS silently normalizes (e.g. 2026-02-30 → 2026-03-02).
const parseableDate = (message: string) =>
  z.string().refine((v) => {
    if (!/^\d{4}-\d{2}-\d{2}/.test(v)) return false;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return false;
    const ymd = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
    return ymd === v.slice(0, 10);
  }, message);

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['VOLUNTEER', 'ORGANIZATION_ADMIN']).optional(),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid WhatsApp number'),
  gender: z.enum(GENDERS, { message: 'Please select a gender' }),
  dateOfBirth: parseableDate('Enter a valid date of birth').refine((val) => {
    const date = new Date(val);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()) ? age - 1 : age;
    return actualAge >= 14;
  }, 'You must be at least 14 years old'),
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
