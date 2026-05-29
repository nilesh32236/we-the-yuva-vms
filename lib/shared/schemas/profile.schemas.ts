import { z } from 'zod';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Weekend'] as const;

export const VolunteerProfileSchema = z.object({
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
});

export const StaffProfileSchema = z.object({
  locationName: z.string().min(1, 'Location name is required').max(100, 'Location name too long'),
  district: z.string().max(100, 'District name too long').optional(),
  state: z.string().max(100, 'State name too long').optional(),
  department: z.string().max(100).optional(),
  designation: z.string().max(100).optional(),
});

export const UpdateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
});
