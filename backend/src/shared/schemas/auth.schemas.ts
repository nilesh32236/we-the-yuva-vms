import { z } from 'zod';

const AddressSchema = z.object({
  street: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().optional(),
  country: z.string().optional(),
});

const CallAvailabilitySlotSchema = z.object({
  day: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:MM)'),
});

const CallAvailabilitySchema = z.object({
  preference: z.enum(['anytime', 'anyday_after', 'specific_days', 'weekends', 'custom']),
  afterTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:MM)')
    .optional(),
  days: z.array(z.number().min(0).max(6)).optional(),
  slots: z.array(CallAvailabilitySlotSchema).optional(),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['VOLUNTEER', 'ORGANIZATION_ADMIN']).optional(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number too long')
    .regex(/^\+?\d{1,3}[\s\-]?\d{6,14}$/, 'Invalid phone number format'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in ISO format (YYYY-MM-DD)').refine(
    (val) => {
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) return false;
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
          ? age - 1
          : age;
      return actualAge >= 14;
    },
    { message: 'You must be at least 14 years old' }
  ),
  address: AddressSchema,
  reference: z.string().optional(),
  callAvailability: CallAvailabilitySchema.optional(),
  whyVoluntary: z
    .string()
    .max(500, 'Must be 500 characters or less')
    .optional(),
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
