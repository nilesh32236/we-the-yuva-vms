'use client';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  GraduationCap,
  Heart,
  MapPin,
  Phone,
  Shield,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CURRENT_STATUS,
  DAYS,
  FREQUENCY,
  GENDERS,
  HOPED_GAINS,
  INTEREST_AREAS,
  LANGUAGES,
  MOTIVATIONS,
  PROFICIENCY,
  REFERRAL_SOURCES,
  SKILL_OPTIONS,
  TIME_SLOTS,
  VOLUNTEER_TYPES,
} from '@/lib/shared';
import type { OnboardingData } from '@/lib/shared';
import { SkeletonCard } from '../../../components/shared/SkeletonCard';
import { Button } from '../../../components/ui/Button';
import { FileUpload } from '../../../components/shared/FileUpload';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { ROLE_ROUTES } from '../../../lib/shared/permissions';

const STEPS = [
  { icon: User, label: 'Personal Info' },
  { icon: GraduationCap, label: 'Education' },
  { icon: Heart, label: 'Volunteer Profile' },
  { icon: MapPin, label: 'Availability' },
  { icon: Phone, label: 'Experience' },
  { icon: Shield, label: 'Emergency' },
  { icon: Check, label: 'Consent' },
];

const FUTURE_ROLES = [
  'TEACHING',
  'MENTORING',
  'FIELD_WORK',
  'EVENT_MANAGEMENT',
  'ADMINISTRATION',
  'TECHNOLOGY',
  'FUNDRAISING',
  'CONTENT_CREATION',
  'PHOTOGRAPHY',
  'DOCUMENTATION',
] as const;

function ChipSelect<T extends string>({
  options,
  selected,
  toggle,
  labelMap,
}: {
  options: readonly T[];
  selected: T[];
  toggle: (val: T) => void;
  labelMap?: Partial<Record<T, string>>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
            selected.includes(opt)
              ? 'bg-brand-primary text-white border-brand-primary'
              : 'border-brand-border text-brand-text hover:border-brand-primary'
          }`}
        >
          {labelMap?.[opt] ?? opt}
        </button>
      ))}
    </div>
  );
}

export default function SetupProfilePage() {
  const router = useRouter();
  const { user, isLoading, refetch } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [s1, setS1] = useState({
    fullName: '', gender: '' as string, dateOfBirth: '', mobile: '',
    profilePhoto: '',
    address: '', city: '', district: '', state: '', pincode: '',
  });
  const [s2, setS2] = useState({
    highestQualification: '', fieldOfStudy: '', currentStatus: '' as string,
    institutionName: '', course: '', year: '', collegeAddress: '',
    companyName: '', designation: '', industry: '', officeAddress: '',
    profession: '', businessName: '', workAddress: '',
  });
  const [s3, setS3] = useState({
    volunteerType: '' as string,
    areasOfInterest: [] as string[],
    skills: [] as string[],
    languages: [] as { language: string; proficiency: string }[],
  });
  const [langInput, setLangInput] = useState({ language: '', proficiency: '' });
  const [s4, setS4] = useState({
    daysAvailable: [] as string[],
    preferredTime: [] as string[],
    frequency: '' as string,
    maxHours: '' as string,
    preferredCity: '', maxTravelDistance: '' as string, availableForOnline: false,
  });
  const [s5, setS5] = useState({
    hasVolunteered: false,
    organizationName: '', role: '', duration: '', nature: '', totalHours: '',
    motivations: [] as string[],
    hopedGains: [] as string[],
  });
  const [s6, setS6] = useState({
    emergencyName: '', emergencyRelationship: '', emergencyPhone: '',
    medicalCondition: '', accessibilityNeeds: '', dietaryPreference: '',
    hasSmartphone: false, usesWhatsapp: false, hasLaptop: false, comfortableOnline: false,
  });
  const [s7, setS7] = useState({
    privacyPolicyAccepted: false, codeOfConductAccepted: false,
    mediaConsentAccepted: false, whatsappConsentAccepted: false,
    linkedinUrl: '', instagramUrl: '', facebookUrl: '', portfolioUrl: '',
    referralSource: '' as string,
    preferredCauseAreas: [] as string[],
    preferredRoles: [] as string[],
    workingStyle: '' as string,
    preferredEngagement: '' as string,
  });

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  const handleComplete = async () => {
    await refetch();
    if (user?.role === 'VOLUNTEER') {
      router.push('/volunteer/dashboard');
      return;
    }
    const roleRoutes: Record<string, string> = {
      COORDINATOR: '/coordinator/dashboard',
      ADMIN: '/admin/dashboard',
      PLATFORM_MANAGER: '/admin/dashboard',
      OBSERVER: '/observer/dashboard',
      ORGANIZATION_ADMIN: '/organization/dashboard',
    };
    router.push(roleRoutes[user?.role ?? ''] ?? '/login');
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!s1.fullName || !s1.gender || !s1.dateOfBirth || !s1.mobile || !s1.address || !s1.city || !s1.district || !s1.state || !s1.pincode) {
        toast({ title: 'Please fill all personal information fields', variant: 'destructive' });
        return false;
      }
    }
    if (step === 1) {
      if (!s2.highestQualification || !s2.fieldOfStudy || !s2.currentStatus) {
        toast({ title: 'Please fill education and current status', variant: 'destructive' });
        return false;
      }
    }
    if (step === 2) {
      if (!s3.volunteerType || s3.areasOfInterest.length === 0 || s3.skills.length === 0 || s3.languages.length === 0) {
        toast({ title: 'Please complete all volunteer profile fields', variant: 'destructive' });
        return false;
      }
    }
    if (step === 3) {
      if (s4.daysAvailable.length === 0 || s4.preferredTime.length === 0 || !s4.frequency || !s4.maxHours || !s4.preferredCity || !s4.maxTravelDistance) {
        toast({ title: 'Please complete availability details', variant: 'destructive' });
        return false;
      }
    }
    if (step === 4) {
      if (s5.motivations.length === 0) {
        toast({ title: 'Please select at least one motivation', variant: 'destructive' });
        return false;
      }
    }
    if (step === 5) {
      if (!s6.emergencyName || !s6.emergencyRelationship || !s6.emergencyPhone) {
        toast({ title: 'Please fill emergency contact details', variant: 'destructive' });
        return false;
      }
    }
    if (step === 6) {
      if (!s7.privacyPolicyAccepted || !s7.codeOfConductAccepted || !s7.referralSource) {
        toast({ title: 'Please accept policies and select referral source', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      const payload: OnboardingData = {
        step1: {
          fullName: s1.fullName,
          gender: s1.gender as OnboardingData['step1']['gender'],
          dateOfBirth: s1.dateOfBirth,
          mobile: s1.mobile,
          profilePhoto: s1.profilePhoto || undefined,
          address: s1.address,
          city: s1.city,
          district: s1.district,
          state: s1.state,
          pincode: s1.pincode,
        },
        step2: {
          highestQualification: s2.highestQualification,
          fieldOfStudy: s2.fieldOfStudy,
          currentStatus: s2.currentStatus as OnboardingData['step2']['currentStatus'],
          educationDetail: ['STUDENT'].includes(s2.currentStatus)
            ? { institutionName: s2.institutionName, course: s2.course, year: s2.year, address: s2.collegeAddress }
            : undefined,
          professionalDetail: ['WORKING_PROFESSIONAL'].includes(s2.currentStatus)
            ? { companyName: s2.companyName, designation: s2.designation, industry: s2.industry, officeAddress: s2.officeAddress }
            : undefined,
          selfEmployedDetail: s2.currentStatus === 'SELF_EMPLOYED'
            ? { profession: s2.profession, businessName: s2.businessName, workAddress: s2.workAddress }
            : undefined,
        },
        step3: {
          volunteerType: s3.volunteerType as OnboardingData['step3']['volunteerType'],
          areasOfInterest: s3.areasOfInterest as OnboardingData['step3']['areasOfInterest'],
          skills: s3.skills as OnboardingData['step3']['skills'],
          languages: s3.languages as OnboardingData['step3']['languages'],
        },
        step4: {
          daysAvailable: s4.daysAvailable as OnboardingData['step4']['daysAvailable'],
          preferredTime: s4.preferredTime as OnboardingData['step4']['preferredTime'],
          frequency: s4.frequency as OnboardingData['step4']['frequency'],
          maxHours: s4.maxHours,
          preferredCity: s4.preferredCity,
          maxTravelDistance: s4.maxTravelDistance,
          availableForOnline: s4.availableForOnline,
        },
        step5: {
          previousExperience: {
            hasVolunteered: s5.hasVolunteered,
            organizationName: s5.hasVolunteered ? s5.organizationName : undefined,
            role: s5.hasVolunteered ? s5.role : undefined,
            duration: s5.hasVolunteered ? s5.duration : undefined,
            nature: s5.hasVolunteered ? s5.nature : undefined,
            totalHours: s5.hasVolunteered ? s5.totalHours : undefined,
          },
          motivations: s5.motivations as OnboardingData['step5']['motivations'],
          hopedGains: s5.hopedGains.length > 0 ? s5.hopedGains as OnboardingData['step5']['hopedGains'] : undefined,
        },
        step6: {
          emergencyName: s6.emergencyName,
          emergencyRelationship: s6.emergencyRelationship,
          emergencyPhone: s6.emergencyPhone,
          medicalCondition: s6.medicalCondition || undefined,
          accessibilityNeeds: s6.accessibilityNeeds || undefined,
          dietaryPreference: s6.dietaryPreference || undefined,
          hasSmartphone: s6.hasSmartphone,
          usesWhatsapp: s6.usesWhatsapp,
          hasLaptop: s6.hasLaptop,
          comfortableOnline: s6.comfortableOnline,
        },
        step7: {
          privacyPolicyAccepted: s7.privacyPolicyAccepted as true,
          codeOfConductAccepted: s7.codeOfConductAccepted as true,
          mediaConsentAccepted: s7.mediaConsentAccepted,
          whatsappConsentAccepted: s7.whatsappConsentAccepted,
          preferredCauseAreas: s7.preferredCauseAreas.length > 0 ? s7.preferredCauseAreas : undefined,
          preferredRoles: s7.preferredRoles.length > 0 ? s7.preferredRoles : undefined,
          workingStyle: s7.workingStyle ? s7.workingStyle as OnboardingData['step7']['workingStyle'] : undefined,
          preferredEngagement: s7.preferredEngagement ? s7.preferredEngagement as OnboardingData['step7']['preferredEngagement'] : undefined,
          linkedinUrl: s7.linkedinUrl || undefined,
          instagramUrl: s7.instagramUrl || undefined,
          facebookUrl: s7.facebookUrl || undefined,
          portfolioUrl: s7.portfolioUrl || undefined,
          referralSource: s7.referralSource as OnboardingData['step7']['referralSource'],
        },
      };

      await api.post('/users/me/onboarding', payload);
      toast({ title: 'Profile saved! Welcome to WeTheYuva.', variant: 'default' });
      await handleComplete();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not save profile. Please try again.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const commonInput = (
    label: string,
    value: string,
    set: (v: string) => void,
    placeholder = '',
    type = 'text',
  ) => {
    const id = `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium text-brand-text">{label}</label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-lg border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
      </div>
    );
  };

  const selectInput = (
    label: string,
    value: string,
    set: (v: string) => void,
    options: readonly string[],
    labelMap?: Partial<Record<string, string>>,
  ) => {
    const id = `select-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium text-brand-text">{label}</label>
        <select
          id={id}
          value={value}
          onChange={(e) => set(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{labelMap?.[opt] ?? opt.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
    );
  };

  const yesNoToggle = (label: string, value: boolean, set: (v: boolean) => void) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-brand-text">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => set(true)}
          className={`px-4 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
            value ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-border text-brand-text'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => set(false)}
          className={`px-4 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
            !value ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-border text-brand-text'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="py-8">
        <SkeletonCard />
      </div>
    );
  }

  if (user.role !== 'VOLUNTEER') {
    return <StaffProfileForm onComplete={handleComplete} />;
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      <div>
        <h1 className="font-heading font-bold text-2xl text-brand-text">Complete Your Profile</h1>
        <p className="text-brand-muted text-sm mt-1">Help us match you with the perfect opportunities</p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-brand-muted">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{STEPS[step].label}</span>
        </div>
        <div className="h-2 bg-brand-border rounded-full overflow-hidden">
          <div className="h-full bg-brand-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => i < step && setStep(i)}
            disabled={i > step}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              i === step
                ? 'bg-brand-primary text-white'
                : i < step
                  ? 'bg-brand-primary/10 text-brand-primary cursor-pointer'
                  : 'bg-brand-border/30 text-brand-muted'
            }`}
            aria-current={i === step ? 'step' : undefined}
            aria-label={i < step ? `Go to ${s.label}` : undefined}
          >
            <s.icon className="w-3 h-3" />
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 space-y-5">
        {/* Step 1: Personal Information */}
        {step === 0 && (
          <>
            <h2 className="font-heading font-semibold text-xl text-brand-text">Personal Information</h2>
            <div className="space-y-4">
              <FileUpload
                label="Profile Photo (Optional)"
                onUpload={(url) => setS1({ ...s1, profilePhoto: url })}
                previewUrl={s1.profilePhoto}
              />
              {commonInput('Full Name *', s1.fullName, (v) => setS1({ ...s1, fullName: v }), 'Your full name')}
              {selectInput('Gender *', s1.gender, (v) => setS1({ ...s1, gender: v }), GENDERS, { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other', PREFER_NOT_TO_SAY: 'Prefer not to say' })}
              {commonInput('Date of Birth *', s1.dateOfBirth, (v) => setS1({ ...s1, dateOfBirth: v }), 'YYYY-MM-DD')}
              {commonInput('Mobile Number *', s1.mobile, (v) => setS1({ ...s1, mobile: v }), '10-digit mobile', 'tel')}
              {commonInput('Address *', s1.address, (v) => setS1({ ...s1, address: v }), 'Full address')}
              <div className="grid grid-cols-2 gap-4">
                {commonInput('City *', s1.city, (v) => setS1({ ...s1, city: v }), 'City')}
                {commonInput('District *', s1.district, (v) => setS1({ ...s1, district: v }), 'District')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {commonInput('State *', s1.state, (v) => setS1({ ...s1, state: v }), 'State')}
                {commonInput('PIN Code *', s1.pincode, (v) => setS1({ ...s1, pincode: v }), '6-digit PIN', 'tel')}
              </div>
            </div>
          </>
        )}

        {/* Step 2: Education & Professional Background */}
        {step === 1 && (
          <>
            <h2 className="font-heading font-semibold text-xl text-brand-text">Education & Background</h2>
            <div className="space-y-4">
              {commonInput('Highest Qualification *', s2.highestQualification, (v) => setS2({ ...s2, highestQualification: v }), 'e.g. B.Com, MBA, 12th Pass')}
              {commonInput('Field of Study *', s2.fieldOfStudy, (v) => setS2({ ...s2, fieldOfStudy: v }), 'e.g. Commerce, Science, Arts')}
              {selectInput('Current Status *', s2.currentStatus, (v) => setS2({ ...s2, currentStatus: v }), CURRENT_STATUS, {
                STUDENT: 'Student', WORKING_PROFESSIONAL: 'Working Professional',
                SELF_EMPLOYED: 'Self Employed', HOMEMAKER: 'Homemaker',
                RETIRED: 'Retired', JOB_SEEKER: 'Job Seeker', OTHER: 'Other',
              })}

              {s2.currentStatus === 'STUDENT' && (
                <div className="border border-brand-border rounded-xl p-4 space-y-4">
                  <p className="text-sm font-semibold text-brand-text">College / University Details</p>
                  {commonInput('Institution Name', s2.institutionName, (v) => setS2({ ...s2, institutionName: v }), 'College / University name')}
                  {commonInput('Course / Degree', s2.course, (v) => setS2({ ...s2, course: v }), 'e.g. B.Tech CSE')}
                  {commonInput('Year', s2.year, (v) => setS2({ ...s2, year: v }), 'e.g. 3rd Year, 2026')}
                  {commonInput('College Address', s2.collegeAddress, (v) => setS2({ ...s2, collegeAddress: v }), 'College address')}
                </div>
              )}

              {s2.currentStatus === 'WORKING_PROFESSIONAL' && (
                <div className="border border-brand-border rounded-xl p-4 space-y-4">
                  <p className="text-sm font-semibold text-brand-text">Professional Details</p>
                  {commonInput('Company Name', s2.companyName, (v) => setS2({ ...s2, companyName: v }), 'Company name')}
                  {commonInput('Designation', s2.designation, (v) => setS2({ ...s2, designation: v }), 'Your role')}
                  {commonInput('Industry', s2.industry, (v) => setS2({ ...s2, industry: v }), 'e.g. IT, Finance, Healthcare')}
                  {commonInput('Office Address', s2.officeAddress, (v) => setS2({ ...s2, officeAddress: v }), 'Office address')}
                </div>
              )}

              {s2.currentStatus === 'SELF_EMPLOYED' && (
                <div className="border border-brand-border rounded-xl p-4 space-y-4">
                  <p className="text-sm font-semibold text-brand-text">Self-Employed Details</p>
                  {commonInput('Profession', s2.profession, (v) => setS2({ ...s2, profession: v }), 'e.g. Freelancer, Business Owner')}
                  {commonInput('Business Name', s2.businessName, (v) => setS2({ ...s2, businessName: v }), 'Business name')}
                  {commonInput('Work Address', s2.workAddress, (v) => setS2({ ...s2, workAddress: v }), 'Work address')}
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 3: Volunteer Profile */}
        {step === 2 && (
          <>
            <h2 className="font-heading font-semibold text-xl text-brand-text">Volunteer Profile</h2>
            <div className="space-y-5">
              {selectInput('Volunteer Type *', s3.volunteerType, (v) => setS3({ ...s3, volunteerType: v }), VOLUNTEER_TYPES, {
                ONE_TIME: 'One Time', REGULAR: 'Regular', WEEKEND: 'Weekend',
                EVENT: 'Event Based', CORPORATE_CSR: 'Corporate CSR',
                STUDENT: 'Student', LONG_TERM: 'Long Term', INTERNSHIP: 'Internship',
              })}

              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-text">Areas of Interest *</p>
                <ChipSelect
                  options={INTEREST_AREAS}
                  selected={s3.areasOfInterest}
                  toggle={(v) => setS3({ ...s3, areasOfInterest: toggleArray(s3.areasOfInterest, v) })}
                  labelMap={{
                    EDUCATION: 'Education', ENVIRONMENT: 'Environment', HEALTH: 'Health',
                    ANIMAL_WELFARE: 'Animal Welfare', YOUTH_DEVELOPMENT: 'Youth Development',
                    WOMENS_EMPOWERMENT: "Women's Empowerment", RURAL_DEVELOPMENT: 'Rural Development',
                    DISASTER_RELIEF: 'Disaster Relief', ARTS_CULTURE: 'Arts & Culture',
                    SPORTS: 'Sports', DIGITAL_LITERACY: 'Digital Literacy',
                    SENIOR_CITIZEN_SUPPORT: 'Senior Citizen Support',
                    COMMUNITY_DEVELOPMENT: 'Community Development', OTHER: 'Other',
                  }}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-text">Skills *</p>
                <ChipSelect
                  options={SKILL_OPTIONS}
                  selected={s3.skills}
                  toggle={(v) => setS3({ ...s3, skills: toggleArray(s3.skills, v) })}
                  labelMap={{
                    TEACHING: 'Teaching', PUBLIC_SPEAKING: 'Public Speaking',
                    EVENT_MANAGEMENT: 'Event Management', PHOTOGRAPHY: 'Photography',
                    GRAPHIC_DESIGN: 'Graphic Design', SOCIAL_MEDIA: 'Social Media',
                    CONTENT_WRITING: 'Content Writing', FUNDRAISING: 'Fundraising',
                    COUNSELLING: 'Counselling', LEADERSHIP: 'Leadership',
                    PROJECT_MANAGEMENT: 'Project Management', WEB_DEVELOPMENT: 'Web Development',
                    SOFTWARE_DEVELOPMENT: 'Software Development', VIDEO_EDITING: 'Video Editing',
                    TRANSLATION: 'Translation', FIRST_AID: 'First Aid',
                    ACCOUNTING: 'Accounting', LEGAL_SUPPORT: 'Legal Support',
                    DATA_ENTRY: 'Data Entry', ADMINISTRATION: 'Administration',
                  }}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-brand-text">Languages *</p>
                {s3.languages.map((l, i) => (
                  <div key={l.language} className="flex items-center gap-2 text-sm">
                    <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full">
                      {l.language} — {l.proficiency}
                    </span>
                    <button
                      type="button"
                      onClick={() => setS3({ ...s3, languages: s3.languages.filter((_, j) => j !== i) })}
                      className="text-brand-muted hover:text-red-500 text-xs cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <select
                    value={langInput.language}
                    onChange={(e) => setLangInput({ ...langInput, language: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-brand-border text-sm bg-background"
                  >
                    <option value="">Select language</option>
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <select
                    value={langInput.proficiency}
                    onChange={(e) => setLangInput({ ...langInput, proficiency: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-brand-border text-sm bg-background"
                  >
                    <option value="">Proficiency</option>
                    {PROFICIENCY.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (langInput.language && langInput.proficiency) {
                        setS3({
                          ...s3,
                          languages: [...s3.languages, { ...langInput }],
                        });
                        setLangInput({ language: '', proficiency: '' });
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Availability & Location */}
        {step === 3 && (
          <>
            <h2 className="font-heading font-semibold text-xl text-brand-text">Availability & Location</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-text">Days Available *</p>
                <ChipSelect
                  options={DAYS}
                  selected={s4.daysAvailable}
                  toggle={(v) => setS4({ ...s4, daysAvailable: toggleArray(s4.daysAvailable, v) })}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-text">Preferred Time *</p>
                <ChipSelect
                  options={TIME_SLOTS}
                  selected={s4.preferredTime}
                  toggle={(v) => setS4({ ...s4, preferredTime: toggleArray(s4.preferredTime, v) })}
                />
              </div>

              {selectInput('Frequency *', s4.frequency, (v) => setS4({ ...s4, frequency: v }), FREQUENCY, {
                WEEKLY: 'Weekly', TWICE_MONTHLY: 'Twice a Month', MONTHLY: 'Monthly',
                OCCASIONALLY: 'Occasionally', HOLIDAYS_ONLY: 'Holidays Only',
              })}

              {selectInput('Max Hours per Week *', s4.maxHours, (v) => setS4({ ...s4, maxHours: v }), ['1-2', '3-5', '6-10', '10+'] as const, {
                '1-2': '1-2 hours', '3-5': '3-5 hours', '6-10': '6-10 hours', '10+': '10+ hours',
              })}

              {commonInput('Preferred City *', s4.preferredCity, (v) => setS4({ ...s4, preferredCity: v }), 'City where you want to volunteer')}

              {selectInput('Max Travel Distance *', s4.maxTravelDistance, (v) => setS4({ ...s4, maxTravelDistance: v }), ['SAME_AREA', 'UPTO_5KM', 'UPTO_10KM', 'UPTO_25KM', 'ANY'] as const, {
                SAME_AREA: 'Same area', UPTO_5KM: 'Up to 5 km', UPTO_10KM: 'Up to 10 km',
                UPTO_25KM: 'Up to 25 km', ANY: 'Any distance',
              })}

              {yesNoToggle('Available for online volunteering?', s4.availableForOnline, (v) => setS4({ ...s4, availableForOnline: v }))}
            </div>
          </>
        )}

        {/* Step 5: Experience & Motivation */}
        {step === 4 && (
          <>
            <h2 className="font-heading font-semibold text-xl text-brand-text">Experience & Motivation</h2>
            <div className="space-y-5">
              <div className="border border-brand-border rounded-xl p-4 space-y-4">
                <p className="text-sm font-semibold text-brand-text">Previous Volunteering</p>
                {yesNoToggle('Have you volunteered before?', s5.hasVolunteered, (v) => setS5({ ...s5, hasVolunteered: v }))}
                {s5.hasVolunteered && (
                  <>
                    {commonInput('Organization Name', s5.organizationName, (v) => setS5({ ...s5, organizationName: v }))}
                    {commonInput('Role', s5.role, (v) => setS5({ ...s5, role: v }))}
                    {commonInput('Duration', s5.duration, (v) => setS5({ ...s5, duration: v }), 'e.g. 6 months')}
                    {commonInput('Nature of Work', s5.nature, (v) => setS5({ ...s5, nature: v }))}
                    {commonInput('Total Hours', s5.totalHours, (v) => setS5({ ...s5, totalHours: v }), 'Approximate hours')}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-text">What motivates you to volunteer? *</p>
                <ChipSelect
                  options={MOTIVATIONS}
                  selected={s5.motivations}
                  toggle={(v) => setS5({ ...s5, motivations: toggleArray(s5.motivations, v) })}
                  labelMap={{
                    HELP_SOCIETY: 'Help Society', LEARN_SKILLS: 'Learn New Skills',
                    BUILD_CAREER: 'Build Career', MEET_PEOPLE: 'Meet Like-minded People',
                    COLLEGE_REQUIREMENT: 'College Requirement', CSR_PARTICIPATION: 'CSR Participation',
                    PERSONAL_SATISFACTION: 'Personal Satisfaction',
                    COMMUNITY_SERVICE: 'Community Service', OTHER: 'Other',
                  }}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-text">What do you hope to gain?</p>
                <ChipSelect
                  options={HOPED_GAINS}
                  selected={s5.hopedGains}
                  toggle={(v) => setS5({ ...s5, hopedGains: toggleArray(s5.hopedGains, v) })}
                  labelMap={{
                    LEADERSHIP: 'Leadership', COMMUNICATION: 'Communication',
                    NETWORKING: 'Networking', PROJECT_MANAGEMENT: 'Project Management',
                    TEACHING_EXPERIENCE: 'Teaching Experience', CERTIFICATES: 'Certificates',
                    COMMUNITY_IMPACT: 'Community Impact',
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Step 6: Emergency, Accessibility & Digital */}
        {step === 5 && (
          <>
            <h2 className="font-heading font-semibold text-xl text-brand-text">Emergency & Accessibility</h2>
            <div className="space-y-5">
              <div className="border border-brand-border rounded-xl p-4 space-y-4">
                <p className="text-sm font-semibold text-brand-text">Emergency Contact *</p>
                {commonInput('Contact Name *', s6.emergencyName, (v) => setS6({ ...s6, emergencyName: v }))}
                {commonInput('Relationship *', s6.emergencyRelationship, (v) => setS6({ ...s6, emergencyRelationship: v }), 'e.g. Parent, Spouse, Friend')}
                {commonInput('Phone *', s6.emergencyPhone, (v) => setS6({ ...s6, emergencyPhone: v }), '10-digit phone', 'tel')}
              </div>

              <div className="border border-brand-border rounded-xl p-4 space-y-4">
                <p className="text-sm font-semibold text-brand-text">Health & Accessibility</p>
                {commonInput('Medical Conditions', s6.medicalCondition, (v) => setS6({ ...s6, medicalCondition: v }), 'Any medical conditions we should know')}
                {commonInput('Accessibility Needs', s6.accessibilityNeeds, (v) => setS6({ ...s6, accessibilityNeeds: v }))}
                {commonInput('Dietary Preference', s6.dietaryPreference, (v) => setS6({ ...s6, dietaryPreference: v }), 'e.g. Vegetarian, Vegan, No preference')}
              </div>

              <div className="border border-brand-border rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-brand-text">Digital Readiness</p>
                {yesNoToggle('Do you have a smartphone?', s6.hasSmartphone, (v) => setS6({ ...s6, hasSmartphone: v }))}
                {yesNoToggle('Do you use WhatsApp?', s6.usesWhatsapp, (v) => setS6({ ...s6, usesWhatsapp: v }))}
                {yesNoToggle('Do you have a laptop/desktop?', s6.hasLaptop, (v) => setS6({ ...s6, hasLaptop: v }))}
                {yesNoToggle('Comfortable with online tools?', s6.comfortableOnline, (v) => setS6({ ...s6, comfortableOnline: v }))}
              </div>
            </div>
          </>
        )}

        {/* Step 7: Consent & Final */}
        {step === 6 && (
          <>
            <h2 className="font-heading font-semibold text-xl text-brand-text">Final Steps</h2>
            <div className="space-y-5">
              <div className="border border-brand-border rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-brand-text">Consent & Policies</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s7.privacyPolicyAccepted}
                    onChange={(e) => setS7({ ...s7, privacyPolicyAccepted: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm text-brand-text">
                    I accept the Privacy Policy and agree to my data being stored and used for volunteer matching.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s7.codeOfConductAccepted}
                    onChange={(e) => setS7({ ...s7, codeOfConductAccepted: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm text-brand-text">
                    I agree to follow the Code of Conduct and uphold the values of WeTheYuva.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s7.mediaConsentAccepted}
                    onChange={(e) => setS7({ ...s7, mediaConsentAccepted: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm text-brand-text">
                    I consent to being photographed/filmed during events for promotional purposes.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s7.whatsappConsentAccepted}
                    onChange={(e) => setS7({ ...s7, whatsappConsentAccepted: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm text-brand-text">
                    I consent to receiving WhatsApp communications about opportunities and updates.
                  </span>
                </label>
              </div>

              <div className="border border-brand-border rounded-xl p-4 space-y-4">
                <p className="text-sm font-semibold text-brand-text">Future Matching Preferences (Recommended)</p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-brand-text">Preferred Cause Areas</p>
                  <ChipSelect
                    options={INTEREST_AREAS}
                    selected={s7.preferredCauseAreas}
                    toggle={(v) => setS7({ ...s7, preferredCauseAreas: toggleArray(s7.preferredCauseAreas, v) })}
                    labelMap={{
                      EDUCATION: 'Education', ENVIRONMENT: 'Environment', HEALTH: 'Health',
                      ANIMAL_WELFARE: 'Animal Welfare', YOUTH_DEVELOPMENT: 'Youth Development',
                      WOMENS_EMPOWERMENT: "Women's Empowerment", RURAL_DEVELOPMENT: 'Rural Development',
                      DISASTER_RELIEF: 'Disaster Relief', ARTS_CULTURE: 'Arts & Culture',
                      SPORTS: 'Sports', DIGITAL_LITERACY: 'Digital Literacy',
                      SENIOR_CITIZEN_SUPPORT: 'Senior Citizen Support',
                      COMMUNITY_DEVELOPMENT: 'Community Development', OTHER: 'Other',
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-brand-text">Preferred Volunteer Roles</p>
                  <ChipSelect
                    options={FUTURE_ROLES}
                    selected={s7.preferredRoles}
                    toggle={(v) => setS7({ ...s7, preferredRoles: toggleArray(s7.preferredRoles, v) })}
                    labelMap={{
                      TEACHING: 'Teaching', MENTORING: 'Mentoring', FIELD_WORK: 'Field Work',
                      EVENT_MANAGEMENT: 'Event Management', ADMINISTRATION: 'Administration',
                      TECHNOLOGY: 'Technology', FUNDRAISING: 'Fundraising',
                      CONTENT_CREATION: 'Content Creation', PHOTOGRAPHY: 'Photography',
                      DOCUMENTATION: 'Documentation'
                    }}
                  />
                </div>

                {selectInput('Preferred Working Style', s7.workingStyle, (v) => setS7({ ...s7, workingStyle: v }), ['INDIVIDUAL', 'TEAM', 'BOTH'] as const, {
                  INDIVIDUAL: 'Individual', TEAM: 'Team', BOTH: 'Both (Individual or Team)'
                })}

                {selectInput('Preferred Engagement', s7.preferredEngagement, (v) => setS7({ ...s7, preferredEngagement: v }), ['ONE_DAY', 'WEEKLY', 'LONG_TERM', 'PROJECT_BASED'] as const, {
                  ONE_DAY: 'One Day / One-off', WEEKLY: 'Weekly / Regular',
                  LONG_TERM: 'Long-term', PROJECT_BASED: 'Project Based'
                })}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-brand-text">Social / Portfolio (Optional)</p>
                {commonInput('LinkedIn URL', s7.linkedinUrl, (v) => setS7({ ...s7, linkedinUrl: v }), 'https://linkedin.com/in/...')}
                {commonInput('Instagram URL', s7.instagramUrl, (v) => setS7({ ...s7, instagramUrl: v }), 'https://instagram.com/...')}
                {commonInput('Facebook URL', s7.facebookUrl, (v) => setS7({ ...s7, facebookUrl: v }), 'https://facebook.com/...')}
                {commonInput('Portfolio URL', s7.portfolioUrl, (v) => setS7({ ...s7, portfolioUrl: v }), 'https://...')}
              </div>

              {selectInput('How did you hear about us? *', s7.referralSource, (v) => setS7({ ...s7, referralSource: v }), REFERRAL_SOURCES, {
                FRIEND: 'Friend / Family', COLLEGE: 'College / University',
                ORGANIZATION: 'Another Organization', SOCIAL_MEDIA: 'Social Media',
                WEBSITE: 'Our Website', CSR_PARTNER: 'CSR Partner',
                VOLUNTEER: 'Existing Volunteer', NEWSPAPER: 'Newspaper',
                EVENT: 'Event', OTHER: 'Other',
              })}
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              variant="cta"
              className={step === 0 ? 'w-full' : 'flex-1'}
              onClick={() => {
                if (validateStep()) setStep(step + 1);
              }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Complete Registration <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StaffProfileForm({ onComplete }: { onComplete: () => void }) {
  const { toast } = useToast();
  const [locationName, setLocationName] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!locationName.trim()) return;
    setIsLoading(true);
    try {
      await api.post('/users/me/staff-profile', {
        locationName,
        district: district || undefined,
        state: state || undefined,
      });
      onComplete();
    } catch (err) {
      const message =
        (
          err as {
            normalizedMessage?: string;
            response?: { data?: { error?: string; message?: string } };
          }
        )?.normalizedMessage ??
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data
          ?.error ??
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data
          ?.message ??
        'Could not save profile. Please try again.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 space-y-5">
      <h2 className="font-heading font-semibold text-xl text-brand-text">Set up your profile</h2>
      <div className="space-y-4">
        {[
          { id: 'locationName', label: 'Location / Area *', value: locationName, setter: setLocationName, placeholder: 'e.g. Mumbai Central' },
          { id: 'district', label: 'District', value: district, setter: setDistrict, placeholder: 'e.g. Mumbai' },
          { id: 'state', label: 'State', value: state, setter: setState, placeholder: 'e.g. Maharashtra' },
        ].map(({ id, label, value, setter, placeholder }) => (
          <div key={id} className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-medium text-brand-text">{label}</label>
            <input
              id={id}
              type="text"
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
        ))}
      </div>
      <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!locationName.trim()} loading={isLoading}>
        Complete Setup <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
