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
    locationId: z.string().optional(),
    // TODO: add future-date validation only for CREATE in production
    // Currently relaxed for editing existing records
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    hoursPerSession: z.number().positive('Hours per session must be positive'),
    totalSlots: z.number().int().positive('Total slots must be a positive integer'),
    isRemote: z.boolean(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const EventSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    // TODO: add future-date validation only for CREATE in production
    // Currently relaxed for editing existing records
    eventDate: z.string().datetime(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    venue: z.string().max(200, 'Venue name too long').optional(),
    capacity: z.number().int().positive('Capacity must be a positive integer'),
    isVirtual: z.boolean(),
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
        volunteerId: z.string(),
        attended: z.boolean(),
      })
    )
    .min(1, 'At least one attendance record is required'),
});

export const CheckInSchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  qrToken: z.string().optional(),
});

export const CheckOutSchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});
