'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  GraduationCap,
  Heart,
  Megaphone,
  Sprout,
  FileCheck,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { OnboardingSchema, StaffProfileSchema } from '@/lib/shared';
import type { OnboardingData, StaffProfileInput } from '@/lib/shared';
import { SkeletonCard } from '../../../components/shared/SkeletonCard';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { ROLE_ROUTES } from '../../../lib/shared/permissions';
import { Step1PersonalInfo } from '../../../components/onboarding/Step1PersonalInfo';
import { Step2Education } from '../../../components/onboarding/Step2Education';
import { Step3VolunteerProfile } from '../../../components/onboarding/Step3VolunteerProfile';
import { Step4Referral } from '../../../components/onboarding/Step4Referral';
import { Step5KindnessOptIn, type KindnessOptIn } from '../../../components/onboarding/Step5KindnessOptIn';
import { Step6Declaration } from '../../../components/onboarding/Step6Declaration';

const DRAFT_KEY = 'setup-profile-draft';

const STEPS = [
  { icon: User, label: 'Personal Info' },
  { icon: GraduationCap, label: 'Education' },
  { icon: Heart, label: 'Volunteer Profile' },
  { icon: Megaphone, label: 'How You Found Us' },
  { icon: Sprout, label: 'Kindness Challenge' },
  { icon: FileCheck, label: 'Declaration' },
] as const;

const STEP_FIELDS: string[][] = [
  ['gender', 'whatsappNumber', 'address.city', 'address.district', 'address.state', 'address.pincode'],
  [
    'education',
    'currentStatus',
    'student.institution',
    'student.course',
    'student.yearSemester',
    'student.city',
    'professional.company',
    'professional.designation',
    'professional.industry',
    'professional.city',
    'selfEmployed.profession',
    'selfEmployed.organizationName',
    'selfEmployed.city',
  ],
  ['volunteerType', 'timeCommitment.hoursPerWeek', 'timeCommitment.hoursPerMonth', 'timeCommitment.preferredDaysTimes', 'opportunityInterests', 'whyVoluntary', 'skills', 'digitalReadiness.smartphone', 'digitalReadiness.whatsapp', 'digitalReadiness.laptop', 'digitalReadiness.onlineVolunteering'],
  ['referralSource', 'referralSourceName'],
  [], // custom component, validated inline
  ['declarations.infoCorrect', 'declarations.commitmentsAccepted'],
];

const tomorrowIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const defaultValues: OnboardingData = {
  gender: '' as never,
  whatsappNumber: '',
  address: { city: '', district: '', state: '', pincode: '' },
  avatarUrl: '',
  education: '',
  fieldOfStudy: '',
  currentStatus: '' as never,
  volunteerType: '' as never,
  timeCommitment: {},
  opportunityInterests: [],
  whyVoluntary: '',
  skills: [],
  digitalReadiness: { smartphone: false, whatsapp: false, laptop: false, onlineVolunteering: false, tools: [] },
  referralSource: '' as never,
  referralSourceName: '',
  declarations: { infoCorrect: false as never, commitmentsAccepted: false as never },
} as never;

export default function SetupProfilePage() {
  const router = useRouter();
  const { user, isLoading, refetch } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [kindness, setKindness] = useState<KindnessOptIn>({ optedIn: false, acts: [], startDate: tomorrowIso() });
  const [kindnessError, setKindnessError] = useState<string | null>(null);

  const {
    register,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors, isDirty },
  } = useForm<OnboardingData>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues,
  });

  // Load draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = OnboardingSchema.safeParse(JSON.parse(saved));
        if (parsed.success) {
          reset(parsed.data);
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [reset]);

  // Save draft on form changes
  useEffect(() => {
    const sub = watch((data) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      } catch {
        /* quota exceeded — ignore */
      }
    });
    return () => sub.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    if (isDirty) {
      window.addEventListener('beforeunload', handler);
    } else {
      window.removeEventListener('beforeunload', handler);
    }
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [isDirty]);

  // Persist step to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('setup-profile-step', String(step));
    } catch {
      /* ignore */
    }
  }, [step]);

  // Restore step from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('setup-profile-step');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed < STEPS.length) {
          setStep(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const goToStep = (newStep: number) => {
    setFormError(null);
    setStep(newStep);
  };

  const validateStep = async (stepIndex: number): Promise<boolean> => {
    const fields = STEP_FIELDS[stepIndex];
    if (fields.length === 0) return true;
    const results = await Promise.all(fields.map((f) => trigger(f as never)));
    const valid = results.every(Boolean);
    if (!valid) toast({ title: 'Please fix the highlighted fields', variant: 'destructive' });
    return valid;
  };

  const handleNext = async () => {
    if (step === 4) {
      if (!kindness.optedIn) {
        setKindnessError(null);
        return goToStep(step + 1);
      }
      if (kindness.acts.length === 0 || !kindness.startDate) {
        setKindnessError('Select at least one act of kindness and a start date');
        return;
      }
      setKindnessError(null);
      return goToStep(step + 1);
    }
    if (await validateStep(step)) {
      goToStep(step + 1);
    }
  };

  const handleBack = () => {
    goToStep(step - 1);
  };

  const handleComplete = async () => {
    localStorage.removeItem(DRAFT_KEY);
    const freshUser = await refetch();
    router.push(ROLE_ROUTES[freshUser?.role ?? ''] ?? '/login');
  };

  const handleSubmitForm = async () => {
    for (let i = 0; i < STEPS.length; i++) {
      if (i === 4) {
        if (kindness.optedIn && (kindness.acts.length === 0 || !kindness.startDate)) {
          setKindnessError('Select at least one act of kindness and a start date');
          goToStep(i);
          return;
        }
        continue;
      }
      const valid = await validateStep(i);
      if (!valid) {
        goToStep(i);
        return;
      }
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const data = watch();
      await api.put('/users/me/onboarding', data);

      if (kindness.optedIn) {
        try {
          await api.post('/kindness-challenge', {
            acts: kindness.acts,
            startDate: kindness.startDate,
          });
        } catch {
          // Non-fatal: challenge can be started from the dashboard card later
          toast({ title: 'Heads up', description: 'Profile saved, but the challenge could not be started. You can start it from your dashboard.' });
        }
      }
      localStorage.removeItem(DRAFT_KEY);
      const freshUser = await refetch();
      router.push(ROLE_ROUTES[freshUser?.role ?? ''] ?? '/login');
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not save profile. Please try again.';
      setFormError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
  const stepProps = { register, setValue, watch, errors };
  const stepComponents = [
    <Step1PersonalInfo key={0} {...stepProps} />,
    <Step2Education key={1} {...stepProps} />,
    <Step3VolunteerProfile key={2} {...stepProps} />,
    <Step4Referral key={3} {...stepProps} />,
    <Step5KindnessOptIn key={4} value={kindness} onChange={setKindness} />,
    <Step6Declaration key={5} {...stepProps} />,
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      <div>
        <h1 className="font-heading font-bold text-2xl text-brand-text">Complete Your Profile</h1>
        <p className="text-brand-muted text-sm mt-1">
          Help us match you with the perfect opportunities
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-brand-muted">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{STEPS[step].label}</span>
        </div>
        <div
          className="h-2 bg-brand-border rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Profile completion progress"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-brand-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1 overflow-x-auto pb-2" role="tablist">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            role="tab"
            onClick={() => {
              if (i < step) goToStep(i);
            }}
            disabled={i > step}
            aria-selected={i === step}
            className={`flex items-center gap-1 px-3 py-2.5 min-h-11 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              i === step
                ? 'bg-brand-primary text-white'
                : i < step
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'bg-brand-border/30 text-brand-muted cursor-not-allowed'
            }`}
          >
            <s.icon className="w-3 h-3" />
            {s.label}
          </button>
        ))}
      </div>

      <div
        className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 space-y-5"
        aria-busy={isSubmitting}
      >
        <section aria-live="polite">
          {stepComponents[step]}
        </section>

        {kindnessError && (
          <div className="flex items-start gap-2 bg-brand-error/10 border border-brand-error/30 rounded-lg p-3 text-sm text-brand-error" role="alert">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="flex-1">{kindnessError}</p>
            <button type="button" onClick={() => setKindnessError(null)} className="text-brand-error hover:text-brand-error/80 cursor-pointer shrink-0 p-2 min-w-11 min-h-11" aria-label="Dismiss error">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {formError && (
          <div
            className="flex items-start gap-2 bg-brand-error/10 border border-brand-error/30 rounded-lg p-3 text-sm text-brand-error"
            role="alert"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="flex-1">{formError}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFormError(null)}
              className="text-brand-error hover:text-brand-error hover:bg-brand-error/20 shrink-0"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="cta" className={step === 0 ? 'w-full' : 'flex-1'} onClick={handleNext}>
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSubmitForm}
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffProfileInput>({
    resolver: zodResolver(StaffProfileSchema),
    defaultValues: { locationName: '', district: '', state: '' },
  });

  const onSubmit = async (data: StaffProfileInput) => {
    try {
      await api.post('/users/me/staff-profile', {
        locationName: data.locationName,
        district: data.district || undefined,
        state: data.state || undefined,
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
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 space-y-5"
    >
      <h2 className="font-heading font-semibold text-xl text-brand-text">Set up your profile</h2>
      <div className="space-y-4">
        {[
          { id: 'locationName', label: 'Location / Area *', placeholder: 'e.g. Mumbai Central' },
          { id: 'district', label: 'District', placeholder: 'e.g. Mumbai' },
          { id: 'state', label: 'State', placeholder: 'e.g. Maharashtra' },
        ].map(({ id, label, placeholder }) => (
          <div key={id} className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-medium text-brand-text">
              {label}
            </label>
            <input
              id={id}
              type="text"
              placeholder={placeholder}
              disabled={isSubmitting}
              aria-invalid={!!errors[id as keyof StaffProfileInput]}
              aria-describedby={errors[id as keyof StaffProfileInput] ? `${id}-error` : undefined}
              className={`w-full px-4 py-2.5 rounded-lg border text-base bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
                ${errors[id as keyof StaffProfileInput] ? 'border-brand-error focus:ring-brand-error' : 'border-brand-border'}`}
              {...register(id as keyof StaffProfileInput)}
            />
            {errors[id as keyof StaffProfileInput] && (
              <p id={`${id}-error`} className="text-brand-error text-xs" role="alert">
                {errors[id as keyof StaffProfileInput]?.message}
              </p>
            )}
          </div>
        ))}
      </div>
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        Complete Setup <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}
