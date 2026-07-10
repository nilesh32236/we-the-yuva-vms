import { z } from 'zod';

export const ASPIRATIONS = [
  'Leadership',
  'Communication',
  'Project Management',
  'Teamwork',
  'Public Speaking',
  'Community Organizing',
  'Event Planning',
  'Advocacy',
  'Mentoring',
  'Research',
] as const;

export const GROWTH_AREAS = [
  'Confidence',
  'Leadership',
  'Communication',
  'Problem Solving',
  'Empathy',
  'Teamwork',
  'Time Management',
  'Civic Awareness',
  'Networking',
  'Resilience',
] as const;

export const YouthProfileSchema = z.object({
  aspirations: z
    .array(z.enum(ASPIRATIONS))
    .min(1, 'Please select at least one aspiration')
    .max(5, 'Maximum 5 aspirations'),
  growthAreas: z
    .array(z.enum(GROWTH_AREAS))
    .min(1, 'Please select at least one growth area')
    .max(5, 'Maximum 5 growth areas'),
});
