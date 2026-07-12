import { z } from 'zod';
import { VOLUNTEER_TYPES } from './profile.schemas';

export const EXPERTISE_OPTIONS = [
  'TEACHING', 'PUBLIC_SPEAKING', 'EVENT_MANAGEMENT', 'PHOTOGRAPHY', 'GRAPHIC_DESIGN',
  'SOCIAL_MEDIA', 'CONTENT_WRITING', 'FUNDRAISING', 'COUNSELLING', 'LEADERSHIP',
  'PROJECT_MANAGEMENT', 'WEB_DEVELOPMENT', 'SOFTWARE_DEVELOPMENT', 'VIDEO_EDITING',
  'TRANSLATION', 'FIRST_AID', 'ACCOUNTING', 'LEGAL_SUPPORT', 'DATA_ENTRY', 'ADMINISTRATION',
] as const;

export const LANGUAGES = ['HINDI', 'ENGLISH', 'GUJARATI', 'MARATHI', 'TAMIL', 'TELUGU', 'OTHER'] as const;

export const CAUSES = [
  'EDUCATION', 'HEALTH', 'ENVIRONMENT', 'COMMUNITY', 'ARTS', 'SPORTS', 'TECHNOLOGY', 'ACTIVE_CITIZENSHIP', 'OTHER',
] as const;

export const INTEREST_OPTIONS = [
  'TEACHING_MENTORING', 'HEALTHCARE', 'ENVIRONMENT_CONSERVATION', 'COMMUNITY_SERVICE',
  'ARTS_CULTURE', 'SPORTS_COACHING', 'DIGITAL_LITERACY', 'WOMEN_EMPOWERMENT',
  'YOUTH_DEVELOPMENT', 'DISASTER_RELIEF', 'ANIMAL_WELFARE', 'RURAL_DEVELOPMENT',
] as const;

export const PREFERRED_ACTIVITIES = [
  'FIELD_WORK', 'OFFICE_SUPPORT', 'TEACHING', 'EVENT_MANAGEMENT', 'CONTENT_CREATION',
  'PHOTOGRAPHY', 'SOCIAL_MEDIA', 'FUNDRAISING', 'DATA_ENTRY', 'COUNSELLING',
  'MENTORING', 'RESEARCH',
] as const;

export const AVAILABILITY_PATTERNS = ['WEEKDAYS', 'WEEKENDS', 'BOTH', 'FLEXIBLE'] as const;

export const SocialLinksSchema = z.object({
  linkedin: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
}).optional();

export const OnboardingSchema = z.object({
  step1: z.object({
    skills: z.array(z.string()).min(1, 'Select at least one skill'),
    expertise: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
  }),
  step2: z.object({
    causes: z.array(z.string()).min(1, 'Select at least one cause'),
    interests: z.array(z.string()).default([]),
    preferredActivities: z.array(z.string()).default([]),
  }),
  step3: z.object({
    volunteerType: z.enum(VOLUNTEER_TYPES, { errorMap: () => ({ message: 'Select volunteer type' }) }),
    availabilityPattern: z.enum(AVAILABILITY_PATTERNS),
    hoursPerWeek: z.number().min(1, 'At least 1 hour per week').max(168),
    sessionDuration: z.number().min(0.5, 'Minimum 30 minutes'),
  }),
  step4: z.object({
    education: z.string().min(1, 'Education is required').max(200),
    occupation: z.string().min(1, 'Occupation is required').max(200),
    experience: z.string().min(1, 'Experience is required').max(500),
    certifications: z.array(z.string()).default([]),
  }),
  step5: z.object({
    bio: z.string().max(300, 'Bio must be 300 characters or less'),
    avatarUrl: z.string().optional(),
    socialLinks: SocialLinksSchema,
  }),
});

export type OnboardingData = z.infer<typeof OnboardingSchema>;
