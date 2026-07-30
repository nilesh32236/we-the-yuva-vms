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

const opportunityBaseFields = {
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
  endDate: z.string().datetime(),
  hoursPerSession: z.number().positive('Hours per session must be positive'),
  totalSlots: z.number().int().positive('Total slots must be a positive integer'),
  isRemote: z.boolean(),
};

export const OpportunitySchema = z
  .object({
    ...opportunityBaseFields,
    startDate: z
      .string()
      .datetime()
      .refine(
        (val) => {
          const date = new Date(val);
          return date > new Date();
        },
        { message: 'Start date must be in the future' }
      ),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const UpdateOpportunitySchema = z
  .object({
    ...Object.fromEntries(
      Object.entries(opportunityBaseFields).map(([key, schema]) => [key, schema.optional()])
    ),
    startDate: z.string().datetime().optional(),
  } as Record<string, z.ZodTypeAny>)
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    { message: 'End date must be after start date', path: ['endDate'] }
  );

const eventBaseFields = {
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM format'),
  endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM format'),
  venue: z.string().max(200, 'Venue name too long').optional(),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  isVirtual: z.boolean(),
  meetingLink: z.string().url('Must be a valid URL').optional(),
} as const;

function isAfterTime(start: string, end: string): boolean {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return endH * 60 + endM > startH * 60 + startM;
}

function addEventRefinements<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape)
    .refine((data) => !data.isVirtual || data.meetingLink !== undefined, {
      message: 'Meeting link is required for virtual events',
      path: ['meetingLink'],
    })
    .refine((data) => data.isVirtual || !data.meetingLink, {
      message: 'Meeting link should not be provided for in-person events',
      path: ['meetingLink'],
    })
    .refine((data) => isAfterTime(data.startTime, data.endTime), {
      message: 'End time must be after start time',
      path: ['endTime'],
    });
}

export const CreateEventSchema = addEventRefinements({
  ...eventBaseFields,
  eventDate: z.string().datetime().refine(
    // 5-second grace period protects against clock drift and rapid form submission delays
    (val) => new Date(val) > new Date(Date.now() - 5000),
    { message: 'Event date must be in the future' }
  ),
});

export const EventSchema = addEventRefinements({
  ...eventBaseFields,
  // No future-date requirement for updates — admins may backdate events
  eventDate: z.string().datetime(),
});

export const ApplySchema = z.object({}).strict();

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
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  qrToken: z.string().optional(),
});

export const CheckOutSchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

const EventSeriesBaseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  interval: z.number().int().min(1).default(1),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM format'),
  endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM format'),
  venue: z.string().max(200, 'Venue name too long').optional(),
  isVirtual: z.boolean().default(false),
  meetingLink: z.string().url('Must be a valid URL').optional(),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  endDate: z.string().datetime().optional(),
  maxOccurrences: z.number().int().positive().optional(),
  customRule: z.unknown().optional(),
  firstEventDate: z.string().datetime().optional(),
});

export const EventSeriesSchema = EventSeriesBaseSchema
  .refine(
    (data) => data.isVirtual || !data.meetingLink,
    {
      message: 'Meeting link should not be provided for in-person events',
      path: ['meetingLink'],
    }
  )
  .refine(
    (data) => !data.isVirtual || data.meetingLink !== undefined,
    {
      message: 'Meeting link is required for virtual events',
      path: ['meetingLink'],
    }
  )
  .refine((data) => isAfterTime(data.startTime, data.endTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .refine(
    (data) => {
      if (data.firstEventDate) {
        // 5-second grace period protects against clock drift and rapid form submission delays
        return new Date(data.firstEventDate) > new Date(Date.now() - 5000);
      }
      return true;
    },
    { message: 'First event date must be in the future', path: ['firstEventDate'] }
  )
  .refine(
    (data) => {
      if (data.frequency === 'WEEKLY') {
        return data.daysOfWeek !== undefined && data.daysOfWeek.length > 0;
      }
      return true;
    },
    { message: 'Days of week are required for weekly frequency', path: ['daysOfWeek'] }
  );

export const EventSeriesUpdateSchema = EventSeriesBaseSchema.partial().extend({
  isActive: z.boolean().optional(),
});
