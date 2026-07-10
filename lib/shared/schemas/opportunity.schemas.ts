import { z } from 'zod';

export const OPPORTUNITY_CATEGORIES = [
  'EDUCATION',
  'HEALTH',
  'ENVIRONMENT',
  'COMMUNITY',
  'ARTS',
  'SPORTS',
  'TECHNOLOGY',
  'ACTIVE_CITIZENSHIP',
  'OTHER',
] as const;

export const OpportunitySchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters')
      .max(2000, 'Description too long'),
    skills: z
      .array(z.string().min(1, 'Skill cannot be empty'))
      .min(1, 'Please add at least one skill')
      .max(10, 'Maximum 10 skills allowed'),
    category: z.enum(OPPORTUNITY_CATEGORIES),
    locationId: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.string({ invalid_type_error: 'Location must be a string' }).optional()
    ),
    startDate: z
      .string()
      .datetime()
      .refine((d) => new Date(d) > new Date(), 'Start date must be in the future'),
    endDate: z.string().datetime(),
    hoursPerSession: z.number().positive('Hours per session must be positive'),
    totalSlots: z.number().int().positive('Total slots must be a positive integer'),
    isRemote: z.boolean().default(false),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const EventSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    eventDate: z
      .string()
      .datetime()
      .refine((d) => new Date(d) > new Date(), 'Event date must be in the future'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    venue: z.string().max(200, 'Venue name too long').optional(),
    capacity: z.number().int().positive('Capacity must be a positive integer'),
    isVirtual: z.boolean().default(false),
    meetingLink: z.string().url('Must be a valid URL').optional(),
  })
  .refine((data) => !data.isVirtual || data.meetingLink !== undefined, {
    message: 'Meeting link is required for virtual events',
    path: ['meetingLink'],
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const ApplySchema = z.object({}).optional();

export const ApplicationStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

export const AttendanceSchema = z.object({
  attendances: z
    .array(
      z.object({
        volunteerId: z.string().min(1, 'Volunteer ID is required'),
        attended: z.boolean(),
      })
    )
    .min(1, 'At least one attendance record is required'),
});

export const CheckInSchema = z.object({
  lat: z.coerce
    .number()
    .min(-90, 'Latitude must be >= -90')
    .max(90, 'Latitude must be <= 90')
    .optional(),
  lng: z.coerce
    .number()
    .min(-180, 'Longitude must be >= -180')
    .max(180, 'Longitude must be <= 180')
    .optional(),
  qrToken: z.string().min(1, 'QR token cannot be empty').optional(),
});

export const CheckOutSchema = z.object({
  lat: z.coerce
    .number()
    .min(-90, 'Latitude must be >= -90')
    .max(90, 'Latitude must be <= 90')
    .optional(),
  lng: z.coerce
    .number()
    .min(-180, 'Longitude must be >= -180')
    .max(180, 'Longitude must be <= 180')
    .optional(),
});
