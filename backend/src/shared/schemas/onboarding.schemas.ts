import { z } from 'zod';
import { DAYS, TIME_SLOTS, VOLUNTEER_TYPES } from './profile.schemas';

export const CURRENT_STATUS = ['STUDENT', 'WORKING_PROFESSIONAL', 'SELF_EMPLOYED', 'HOMEMAKER', 'RETIRED', 'JOB_SEEKER', 'OTHER'] as const;

export const INTEREST_AREAS = [
  'EDUCATION', 'ENVIRONMENT', 'HEALTH', 'ANIMAL_WELFARE', 'YOUTH_DEVELOPMENT',
  'WOMENS_EMPOWERMENT', 'RURAL_DEVELOPMENT', 'DISASTER_RELIEF', 'ARTS_CULTURE',
  'SPORTS', 'DIGITAL_LITERACY', 'SENIOR_CITIZEN_SUPPORT', 'COMMUNITY_DEVELOPMENT', 'OTHER',
] as const;

export const SKILL_OPTIONS = [
  'TEACHING', 'PUBLIC_SPEAKING', 'EVENT_MANAGEMENT', 'PHOTOGRAPHY', 'GRAPHIC_DESIGN',
  'SOCIAL_MEDIA', 'CONTENT_WRITING', 'FUNDRAISING', 'COUNSELLING', 'LEADERSHIP',
  'PROJECT_MANAGEMENT', 'WEB_DEVELOPMENT', 'SOFTWARE_DEVELOPMENT', 'VIDEO_EDITING',
  'TRANSLATION', 'FIRST_AID', 'ACCOUNTING', 'LEGAL_SUPPORT', 'DATA_ENTRY', 'ADMINISTRATION',
] as const;

export const LANGUAGES = ['HINDI', 'ENGLISH', 'GUJARATI', 'MARATHI', 'TAMIL', 'TELUGU', 'OTHER'] as const;

export const PROFICIENCY = ['BASIC', 'INTERMEDIATE', 'FLUENT'] as const;

export const FREQUENCY = ['WEEKLY', 'TWICE_MONTHLY', 'MONTHLY', 'OCCASIONALLY', 'HOLIDAYS_ONLY'] as const;

export const MOTIVATIONS = [
  'HELP_SOCIETY', 'LEARN_SKILLS', 'BUILD_CAREER', 'MEET_PEOPLE',
  'COLLEGE_REQUIREMENT', 'CSR_PARTICIPATION', 'PERSONAL_SATISFACTION', 'COMMUNITY_SERVICE', 'OTHER',
] as const;

export const HOPED_GAINS = [
  'LEADERSHIP', 'COMMUNICATION', 'NETWORKING', 'PROJECT_MANAGEMENT',
  'TEACHING_EXPERIENCE', 'CERTIFICATES', 'COMMUNITY_IMPACT',
] as const;

export const REFERRAL_SOURCES = [
  'FRIEND', 'COLLEGE', 'ORGANIZATION', 'SOCIAL_MEDIA', 'WEBSITE',
  'CSR_PARTNER', 'VOLUNTEER', 'NEWSPAPER', 'EVENT', 'OTHER',
] as const;

export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;

export const LanguageSchema = z.object({
  language: z.enum(LANGUAGES),
  proficiency: z.enum(PROFICIENCY),
});

export const PreviousExperienceSchema = z.object({
  hasVolunteered: z.boolean(),
  organizationName: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  duration: z.string().max(100).optional(),
  nature: z.string().max(500).optional(),
  totalHours: z.string().max(50).optional(),
});

export const EducationDetailSchema = z.object({
  institutionName: z.string().max(200).optional(),
  course: z.string().max(200).optional(),
  year: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
});

export const ProfessionalDetailSchema = z.object({
  companyName: z.string().max(200).optional(),
  designation: z.string().max(200).optional(),
  industry: z.string().max(200).optional(),
  officeAddress: z.string().max(500).optional(),
});

export const SelfEmployedDetailSchema = z.object({
  profession: z.string().max(200).optional(),
  businessName: z.string().max(200).optional(),
  workAddress: z.string().max(500).optional(),
});

export const OnboardingSchema = z.object({
  step1: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Please select gender' }) }),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    mobile: z.string().min(10, 'Valid mobile number required').max(15),
    profilePhoto: z.string().optional(),
    address: z.string().min(5, 'Address is required').max(500),
    city: z.string().min(2, 'City is required').max(100),
    district: z.string().min(2, 'District is required').max(100),
    state: z.string().min(2, 'State is required').max(100),
    pincode: z.string().min(6, 'Valid PIN code required').max(10),
  }),
  step2: z.object({
    highestQualification: z.string().min(1, 'Please select qualification'),
    fieldOfStudy: z.string().min(1, 'Please enter field of study').max(200),
    currentStatus: z.enum(CURRENT_STATUS),
    educationDetail: EducationDetailSchema.optional(),
    professionalDetail: ProfessionalDetailSchema.optional(),
    selfEmployedDetail: SelfEmployedDetailSchema.optional(),
  }),
  step3: z.object({
    volunteerType: z.enum(VOLUNTEER_TYPES, { errorMap: () => ({ message: 'Select volunteer type' }) }),
    areasOfInterest: z.array(z.enum(INTEREST_AREAS)).min(1, 'Select at least one area'),
    skills: z.array(z.enum(SKILL_OPTIONS)).min(1, 'Select at least one skill'),
    languages: z.array(LanguageSchema).min(1, 'Add at least one language'),
  }),
  step4: z.object({
    daysAvailable: z.array(z.enum(DAYS)).min(1, 'Select at least one day'),
    preferredTime: z.array(z.enum(TIME_SLOTS)).min(1, 'Select at least one time slot'),
    frequency: z.enum(FREQUENCY),
    maxHours: z.string().min(1, 'Select preferred hours'),
    preferredCity: z.string().min(1, 'Preferred city is required').max(100),
    maxTravelDistance: z.string().min(1, 'Select travel distance'),
    availableForOnline: z.boolean(),
  }),
  step5: z.object({
    previousExperience: PreviousExperienceSchema,
    motivations: z.array(z.enum(MOTIVATIONS)).min(1, 'Select at least one motivation'),
    hopedGains: z.array(z.enum(HOPED_GAINS)).optional(),
  }),
  step6: z.object({
    emergencyName: z.string().min(2, 'Contact name required').max(100),
    emergencyRelationship: z.string().min(2, 'Relationship required').max(100),
    emergencyPhone: z.string().min(10, 'Valid phone required').max(15),
    medicalCondition: z.string().optional(),
    accessibilityNeeds: z.string().optional(),
    dietaryPreference: z.string().optional(),
    hasSmartphone: z.boolean(),
    usesWhatsapp: z.boolean(),
    hasLaptop: z.boolean(),
    comfortableOnline: z.boolean(),
  }),
  step7: z.object({
    privacyPolicyAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the privacy policy' }) }),
    codeOfConductAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the code of conduct' }) }),
    mediaConsentAccepted: z.boolean(),
    whatsappConsentAccepted: z.boolean(),
    preferredCauseAreas: z.array(z.string()).optional(),
    preferredRoles: z.array(z.string()).optional(),
    workingStyle: z.enum(['INDIVIDUAL', 'TEAM', 'BOTH']).optional(),
    preferredEngagement: z.enum(['ONE_DAY', 'WEEKLY', 'LONG_TERM', 'PROJECT_BASED']).optional(),
    linkedinUrl: z.string().url().optional().or(z.literal('')),
    instagramUrl: z.string().url().optional().or(z.literal('')),
    facebookUrl: z.string().url().optional().or(z.literal('')),
    portfolioUrl: z.string().url().optional().or(z.literal('')),
    referralSource: z.enum(REFERRAL_SOURCES),
  }),
});

export type OnboardingData = z.infer<typeof OnboardingSchema>;
