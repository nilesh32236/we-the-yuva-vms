import { z } from 'zod';

export const InitialAssessmentSchema = z.object({
  aspirations: z.array(z.string()).min(1).max(5),
  learningGoals: z.string().max(500).optional(),
  skills: z.array(z.string()).min(1).max(10),
  interests: z.array(z.string()).min(1).max(10),
});

export const YouthReflectionSchema = z.object({
  skillsDeveloped: z.array(z.string()).max(10),
  growthAreas: z.array(z.string()).max(5),
  confidenceLevel: z.number().int().min(1).max(5),
  impactDescription: z.string().max(1000).optional(),
});

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
