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
  z.string().refine((v) => {
    // Accept `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm[:ss]` forms and reject values JS
    // silently normalizes (e.g. 2026-02-30 → 2026-03-02). Compare the parsed
    // LOCAL calendar date to the input's date portion to stay timezone-agnostic.
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

// Optional date fields that forms may submit as an empty string.
const optionalDate = (message: string) =>
  z.preprocess((v) => (v === '' ? undefined : v), parseableDate(message).optional());

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
    hoursPerSession: z.coerce.number().finite().positive('Hours per session must be positive'),
    totalSlots: z.coerce.number().finite().int().positive('Total slots must be a positive integer'),
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
    capacity: z.coerce.number().finite().int().positive('Capacity must be a positive integer'),
    isVirtual: z.boolean(),
    meetingLink: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.string().url('Must be a valid URL').optional()
    ),
  })
  .refine((data) => !data.isVirtual || data.meetingLink !== undefined, {
    message: 'Meeting link is required for virtual events',
    path: ['meetingLink'],
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const ApplySchema = z.object({}).strict().optional();

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
    interval: z.coerce.number().finite().int().min(1).default(1),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    venue: z.string().max(200, 'Venue name too long').optional(),
    isVirtual: z.boolean().default(false),
    meetingLink: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.string().url('Must be a valid URL').optional()
    ),
    capacity: z.coerce.number().finite().int().positive('Capacity must be a positive integer'),
    endDate: optionalDate('End date must be a valid date and time'),
    maxOccurrences: z.coerce.number().finite().int().positive().optional(),
    customRule: z
      .record(z.union([z.string(), z.number(), z.boolean()]))
      .refine((v) => Object.keys(v).length <= 20, 'Custom rule must not exceed 20 properties')
      .optional(),
    firstEventDate: optionalDate('First event date must be a valid date and time'),
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
