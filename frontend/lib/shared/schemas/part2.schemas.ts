import { z } from 'zod';

export const PART2_ROLES = [
  'CAPACITY_BUILDER_TRAINER',
  'COMMUNITY_OUTREACH_SURVEY',
  'GRIEVANCE_SUPPORT_FACILITATOR',
  'SOLUTION_CAMP_COORDINATOR',
  'STAKEHOLDER_LIAISON',
  'WARD_AREA_AMBASSADOR',
  'PROGRAMME_DATA_SUPPORTER',
  'VOLUNTEER_ENGAGEMENT_SUPPORTER',
] as const;

export const LIFE_SKILLS = [
  'COMMUNICATION',
  'PROBLEM_SOLVING',
  'CRITICAL_THINKING',
  'DIGITAL_LITERACY',
  'SELF_CONFIDENCE',
  'LEADERSHIP',
  'TEAMWORK',
  'PUBLIC_SPEAKING',
  'OTHER',
] as const;

const requiredString = z.string().trim().min(1, 'This field is required');
const emptyToUndef = (v: unknown) => (v === '' ? undefined : v);
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const whatsappRegex = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid WhatsApp number');

const RoleMappingSchema = z.object({
  role: z.enum(PART2_ROLES),
  skillsOffer: z.string().trim().max(500).optional().or(z.literal('')),
  skillsDevelop: z.string().trim().max(500).optional().or(z.literal('')),
});

export const Part2Schema = z
  .object({
    kindnessReflection: z
      .string()
      .trim()
      .min(1, 'Reflection is required')
      .refine((s) => {
        const c = wordCount(s);
        return c >= 50 && c <= 200;
      }, 'Reflection must be 50–200 words'),
    aspirations: z.string().trim().min(1, 'Aspirations are required').max(1000),
    roleMappings: z.array(RoleMappingSchema).length(8),
    lifeSkills: z.array(z.enum(LIFE_SKILLS)).min(2, 'Select at least two life skills'),
    lifeSkillsOther: z.string().trim().max(120).optional().or(z.literal('')),
    languages: z
      .array(
        z.object({
          language: z.string().trim().min(1).max(40),
          proficiency: z.enum(['BASIC', 'INTERMEDIATE', 'FLUENT']),
        }),
      )
      .max(10)
      .default([]),
    volunteerRoleTier: z.enum(['GENERAL_VOLUNTEER', 'LEADER', 'COORDINATOR', 'MANAGEMENT', 'INTERN']),
    preferredDays: z.array(z.enum(['WEEKDAYS', 'WEEKENDS'])).max(2).default([]),
    preferredTimeSlots: z.array(z.enum(['MORNING', 'AFTERNOON', 'EVENING'])).max(3).default([]),
    specificDaysTimes: z.string().trim().max(300).optional().or(z.literal('')),
    supportResources: z
      .array(z.enum(['COUNSELING', 'MENTORSHIP', 'COACHING', 'NEED_BASED_CAPACITY_BUILDING']))
      .max(4)
      .default([]),
    preferredCityArea: z.string().trim().max(200).optional().or(z.literal('')),
    maxTravelDistance: z.enum(['WITHIN_5_KM', 'WITHIN_10_KM', 'ANYWHERE']).optional(),
    remoteAvailable: z.boolean().optional(),
    hasVolunteered: z.boolean(),
    previousOrgName: z.string().trim().max(120).optional().or(z.literal('')),
    previousRole: z.string().trim().max(120).optional().or(z.literal('')),
    previousDurationNature: z.string().trim().max(500).optional().or(z.literal('')),
    previousTotalHours: z.preprocess(emptyToUndef, z.coerce.number().finite().min(0).max(10000).optional()),
    linkedinUrl: z.union([z.string().url(), z.literal('')]).optional(),
    instagramUrl: z.union([z.string().url(), z.literal('')]).optional(),
    twitterUrl: z.union([z.string().url(), z.literal('')]).optional(),
    portfolioUrl: z.union([z.string().url(), z.literal('')]).optional(),
    emergencyContactName: requiredString.max(80),
    emergencyRelationship: requiredString.max(40),
    emergencyMobile: whatsappRegex,
    medicalConditions: z.string().trim().max(500).optional().or(z.literal('')),
    privacyPolicyConsent: z.literal(true),
    codeOfConductConsent: z.literal(true),
    mediaConsent: z.boolean(),
    whatsappConsent: z.boolean(),
  })
  .superRefine((d, ctx) => {
    const roles = d.roleMappings.map((r) => r.role);
    if (new Set(roles).size !== roles.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['roleMappings'],
        message: 'Each role must be unique',
      });
    }
    if (d.hasVolunteered) {
      if (!d.previousOrgName?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['previousOrgName'],
          message: 'Required when you have volunteered before',
        });
      }
      if (!d.previousRole?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['previousRole'],
          message: 'Required when you have volunteered before',
        });
      }
    }
    if (d.lifeSkills.includes('OTHER') && !d.lifeSkillsOther?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['lifeSkillsOther'],
        message: 'Please specify other skill',
      });
    }
  });

export type Part2Data = z.infer<typeof Part2Schema>;
