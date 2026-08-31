import { z } from 'zod';

export const VOLUNTEER_TYPES = ['STUDENT_VOLUNTEER', 'LONG_TERM', 'INTERNSHIP', 'OTHER'] as const;
export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;
export const CURRENT_STATUSES = [
  'STUDENT',
  'WORKING_PROFESSIONAL',
  'SELF_EMPLOYED',
  'HOMEMAKER',
  'RETIRED',
  'JOB_SEEKER',
  'OTHER',
] as const;
export const REFERRAL_SOURCES = [
  'FRIEND',
  'COLLEGE',
  'PARTNER_ORG',
  'SOCIAL_MEDIA',
  'WEBSITE',
  'CURRENT_VOLUNTEER',
  'NEWSPAPER',
  'EVENT',
  'OTHER',
] as const;
export const OPPORTUNITY_INTERESTS = ['EDUCATION', 'ACTIVE_CITIZENSHIP', 'ENVIRONMENT'] as const;

const requiredString = z.string().trim().min(1, 'This field is required');

export const StudentInfoSchema = z.object({
  institution: requiredString,
  course: requiredString,
  yearSemester: requiredString,
  city: requiredString,
});

export const ProfessionalInfoSchema = z.object({
  company: requiredString,
  designation: requiredString,
  industry: z.string().trim().min(1),
  city: requiredString,
});

export const SelfEmployedInfoSchema = z.object({
  profession: requiredString,
  organizationName: z.string().trim().max(120).optional().or(z.literal('')),
  city: requiredString,
});

export const RetiredInfoSchema = z.object({
  pastProfession: requiredString.max(120),
});

// Used only for UI hints (≈ h/month ↔ h/week) — no longer validates coupling
export const WEEKS_PER_MONTH = 4.33;
export const round1 = (n: number) => Math.round(n * 10) / 10;

const emptyToUndef = (v: unknown) => (v === '' ? undefined : v);
const TimeCommitmentSchema = z.object({
  hoursPerWeek: z.preprocess(emptyToUndef, z.coerce.number().finite().min(0, 'Min 0h').max(168, 'Max 168h').optional()),
  hoursPerMonth: z.preprocess(emptyToUndef, z.coerce.number().finite().min(0, 'Min 0h').max(744, 'Max 744h').optional()),
  preferredDaysTimes: z.string().trim().max(500).optional(),
});

const DigitalReadinessSchema = z.object({
  smartphone: z.boolean(),
  whatsapp: z.boolean(),
  laptop: z.boolean(),
  onlineVolunteering: z.boolean(),
  tools: z.array(z.string().trim().min(1)).max(20).default([]),
});

export const AddressSchema = z.object({
  city: requiredString,
  district: requiredString,
  state: requiredString,
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit PIN code'),
});

export const DeclarationsSchema = z.object({
  infoCorrect: z.literal(true),
  commitmentsAccepted: z.literal(true),
});

export const OnboardingSchema = z
  .object({
    gender: z.enum(GENDERS).optional().or(z.literal('')),
    whatsappNumber: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid WhatsApp number')
      .optional()
      .or(z.literal('')),
    address: AddressSchema,
    avatarUrl: z
      .union([
        z.string().trim().max(2048).url(),
        z.string().trim().max(2048).regex(/^\/uploads\/[A-Za-z0-9._/-]+$/, 'Invalid avatar path'),
        z.literal(''),
      ])
      .optional(),
    education: requiredString.max(80),
    fieldOfStudy: z.string().trim().max(120).optional().or(z.literal('')),
    currentStatus: z.enum(CURRENT_STATUSES),
    student: StudentInfoSchema.optional(),
    professional: ProfessionalInfoSchema.optional(),
    selfEmployed: SelfEmployedInfoSchema.optional(),
    retired: RetiredInfoSchema.optional(),
    volunteerType: z.enum(VOLUNTEER_TYPES),
    timeCommitment: TimeCommitmentSchema,
    opportunityInterests: z.array(z.enum(OPPORTUNITY_INTERESTS)).min(1, 'Select at least one'),
    whyVoluntary: z.string().trim().min(1).max(500),
    skills: z.array(z.string().trim().min(1)).min(1, 'Add at least one skill').max(20),
    digitalReadiness: DigitalReadinessSchema,
    referralSource: z.enum(REFERRAL_SOURCES),
    referralSourceName: z.string().trim().max(120).optional().or(z.literal('')),
    declarations: DeclarationsSchema,
  })
  .superRefine((data, ctx) => {
    if (data.currentStatus === 'STUDENT' && !data.student) {
      ctx.addIssue({ code: 'custom', path: ['student'], message: 'Student details are required' });
    }
    if (data.currentStatus === 'WORKING_PROFESSIONAL' && !data.professional) {
      ctx.addIssue({
        code: 'custom',
        path: ['professional'],
        message: 'Professional details are required',
      });
    }
    if ((data.currentStatus === 'SELF_EMPLOYED' || data.currentStatus === 'OTHER') && !data.selfEmployed) {
      ctx.addIssue({
        code: 'custom',
        path: ['selfEmployed'],
        message: 'Profession details are required',
      });
    }
    if (data.currentStatus === 'RETIRED' && !data.retired) {
      ctx.addIssue({ code: 'custom', path: ['retired'], message: 'Past profession is required' });
    }
    if (
      ['FRIEND', 'COLLEGE', 'PARTNER_ORG', 'CURRENT_VOLUNTEER'].includes(data.referralSource) &&
      !data.referralSourceName
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['referralSourceName'],
        message: 'Please give the name of your reference',
      });
    }
  });

export type OnboardingData = z.infer<typeof OnboardingSchema>;

// Shape persisted to VolunteerProfile.details (validated on write via OnboardingSchema)
export const VolunteerDetailsSchema = z.object({
  fieldOfStudy: z.string().optional(),
  currentStatus: z.enum(CURRENT_STATUSES).optional(),
  student: StudentInfoSchema.optional(),
  professional: ProfessionalInfoSchema.optional(),
  selfEmployed: SelfEmployedInfoSchema.optional(),
  retired: RetiredInfoSchema.optional(),
  timeCommitment: TimeCommitmentSchema.optional(),
  opportunityInterests: z.array(z.enum(OPPORTUNITY_INTERESTS)).optional(),
  digitalReadiness: DigitalReadinessSchema.optional(),
});
export type VolunteerDetails = z.infer<typeof VolunteerDetailsSchema>;

export const StaffProfileSchema = z.object({
  locationName: z.string().trim().min(1),
  district: z.string().trim().max(80).optional().or(z.literal('')),
  state: z.string().trim().max(80).optional().or(z.literal('')),
});
export type StaffProfileInput = z.infer<typeof StaffProfileSchema>;

export const UpdateMeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(15).optional(),
});
