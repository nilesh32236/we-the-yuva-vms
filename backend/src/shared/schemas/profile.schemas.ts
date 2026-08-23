import { z } from 'zod';
import { VOLUNTEER_TYPES } from './onboarding.schemas';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Weekend'] as const;

export const VolunteerProfileSchema = z.object({
  volunteerType: z.enum(VOLUNTEER_TYPES, {
    errorMap: () => ({ message: 'Please select a valid volunteer type' }),
  }),
  skills: z
    .array(z.string().min(1, 'Skill cannot be empty'))
    .min(1, 'Please add at least one skill')
    .max(20, 'Maximum 20 skills allowed'),
  interests: z
    .array(z.string().min(1, 'Interest cannot be empty'))
    .min(1, 'Please add at least one interest')
    .max(20, 'Maximum 20 interests allowed'),
  availability: z.object({
    days: z.array(z.enum(DAYS)).min(1, 'Please select at least one day'),
    timeSlots: z.array(z.enum(TIME_SLOTS)).min(1, 'Please select at least one time slot'),
  }),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  education: z.string().max(200).optional(),
});

export const MISSING_FIELD_KEYS = ['skills', 'interests', 'volunteerType', 'availability'] as const;

export const ProfileStatusSchema = z.object({
  isComplete: z.boolean(),
  missingFields: z.array(z.enum(MISSING_FIELD_KEYS)),
  completionPercentage: z.number().int().min(0).max(100),
});

export type ProfileStatus = z.infer<typeof ProfileStatusSchema>;
