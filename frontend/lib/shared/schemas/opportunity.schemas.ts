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

const parseableDate = (message: string) =>
  z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), message);

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
    locationId: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
    startDate: parseableDate('Start date must be a valid date and time').refine(
      (d) => new Date(d) > new Date(),
      'Start date must be in the future'
    ),
    endDate: parseableDate('End date must be a valid date and time'),
    hoursPerSession: z.coerce.number().positive('Hours per session must be positive'),
    totalSlots: z.coerce.number().int().positive('Total slots must be a positive integer'),
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
    eventDate: parseableDate('Event date must be a valid date and time').refine(
      (d) => new Date(d) > new Date(),
      'Event date must be in the future'
    ),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    venue: z.string().max(200, 'Venue name too long').optional(),
    capacity: z.coerce.number().int().positive('Capacity must be a positive integer'),
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
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']),
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

export const EventSeriesSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    interval: z.coerce.number().int().min(1).default(1),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    venue: z.string().max(200, 'Venue name too long').optional(),
    isVirtual: z.boolean().default(false),
    meetingLink: z.string().url('Must be a valid URL').optional(),
    capacity: z.coerce.number().int().positive('Capacity must be a positive integer'),
    endDate: parseableDate('End date must be a valid date and time').optional(),
    maxOccurrences: z.coerce.number().int().positive().optional(),
    customRule: z
      .record(z.union([z.string(), z.number(), z.boolean()]))
      .refine((v) => Object.keys(v).length <= 20, 'Custom rule must not exceed 20 properties')
      .optional(),
    firstEventDate: parseableDate('First event date must be a valid date and time').optional(),
  })
  .refine((data) => !data.isVirtual || data.meetingLink !== undefined, {
    message: 'Meeting link is required for virtual events',
    path: ['meetingLink'],
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .refine(
    (data) => {
      if (data.frequency === 'WEEKLY') {
        return data.daysOfWeek !== undefined && data.daysOfWeek.length > 0;
      }
      return true;
    },
    { message: 'Days of week are required for weekly frequency', path: ['daysOfWeek'] }
  );
