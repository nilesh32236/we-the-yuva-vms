import { z } from 'zod';

const AddressSchema = z.object({
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
});

// HH:MM where hours are 0-23 and minutes are 0-59 (the bare regex allows
// impossible clocks like 99:99).
const time24 = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:MM)')
  .refine((v) => {
    const [h, m] = v.split(':').map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }, 'Invalid time (use a real 24h clock time)');

// Accept `YYYY-MM-DD` (or `YYYY-MM-DDTHH:mm[:ss]`) and reject values JS
// silently normalizes (e.g. 2026-02-30 → 2026-03-02). Compare the parsed
// LOCAL calendar date to the input's date portion to stay timezone-agnostic.
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

const CallAvailabilitySlotSchema = z.object({
  day: z.number().min(0).max(6),
  startTime: time24,
  endTime: time24,
});

const CallAvailabilitySchema = z
  .object({
    preference: z.enum(['anytime', 'specific_days', 'custom']),
    days: z.array(z.number().min(0).max(6)).optional(),
    startTime: time24.optional(),
    endTime: time24.optional(),
    slots: z.array(CallAvailabilitySlotSchema).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.preference === 'specific_days') {
      if (!val.days || val.days.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select at least one day',
          path: ['days'],
        });
      }
      if (!val.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start time is required',
          path: ['startTime'],
        });
      }
      if (!val.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End time is required',
          path: ['endTime'],
        });
      }
      if (val.startTime && val.endTime && val.endTime <= val.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End time must be after start time',
          path: ['endTime'],
        });
      }
    }
    if (val.preference === 'custom') {
      if (!val.slots || val.slots.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Add at least one time slot',
          path: ['slots'],
        });
      }
      (val.slots ?? []).forEach((slot, i) => {
        if (slot.endTime <= slot.startTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'End time must be after start time',
            path: ['slots', i, 'endTime'],
          });
        }
      });
    }
  });

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['VOLUNTEER', 'ORGANIZATION_ADMIN']).optional(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number too long')
    .regex(/^\+?[\d\s\-().]+$/, 'Invalid phone number format'),
  dateOfBirth: parseableDate('Enter a valid date of birth').refine((val) => {
    const date = new Date(val);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()) ? age - 1 : age;
    return actualAge >= 14;
  }, 'You must be at least 14 years old'),
  address: AddressSchema,
  reference: z.string().optional(),
  callAvailability: CallAvailabilitySchema.optional(),
  whyVoluntary: z.string().max(500, 'Must be 500 characters or less').optional(),
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
  privacyPolicyAccepted: z.boolean().refine((v) => v === true, {
    message: 'You must accept the privacy policy to continue',
  }),
  mediaConsentAccepted: z.boolean(),
});
