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

export const InitialAssessmentSchema = z.object({
  aspirations: z
    .array(z.enum(ASPIRATIONS))
    .min(1, 'Select at least one aspiration')
    .max(5, 'Select up to 5 aspirations'),
  learningGoals: z.string().max(500, 'Max 500 characters').optional(),
  skills: z.array(z.string().min(1)).min(1, 'Add at least one skill').max(10, 'Max 10 skills'),
  interests: z
    .array(z.string().min(1))
    .min(1, 'Add at least one interest')
    .max(10, 'Max 10 interests'),
});

export const ReflectionSchema = z.object({
  skillsDeveloped: z
    .array(z.string().min(1))
    .min(1, 'Add at least one skill you developed')
    .max(10, 'Max 10 skills'),
  growthAreas: z
    .array(z.enum(GROWTH_AREAS))
    .min(1, 'Select at least one growth area')
    .max(5, 'Select up to 5 growth areas'),
  confidenceLevel: z.number().int().min(1).max(5),
  impactDescription: z.string().max(1000, 'Max 1000 characters').optional(),
});

export type InitialAssessmentInput = z.infer<typeof InitialAssessmentSchema>;
export type ReflectionInput = z.infer<typeof ReflectionSchema>;
