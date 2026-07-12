'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  GraduationCap,
  Heart,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { OnboardingSchema } from '@/lib/shared';
import type { OnboardingData } from '@/lib/shared';
import { SkeletonCard } from '../../../components/shared/SkeletonCard';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { ROLE_ROUTES } from '../../../lib/shared/permissions';
import { StepSkills } from '../../../components/setup-profile/StepSkills';
import { StepInterests } from '../../../components/setup-profile/StepInterests';
import { StepAvailability } from '../../../components/setup-profile/StepAvailability';
import { StepEducation } from '../../../components/setup-profile/StepEducation';
import { StepBio } from '../../../components/setup-profile/StepBio';

const DRAFT_KEY = 'setup-profile-draft';

const STEPS = [
  { icon: User, label: 'Skills & Languages' },
  { icon: Heart, label: 'Interests & Causes' },
  { icon: Clock, label: 'Availability' },
  { icon: GraduationCap, label: 'Education' },
  { icon: BookOpen, label: 'Bio & Social' },
] as const;

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

const defaultValues: OnboardingData = {
  step1: { skills: [], expertise: [], languages: [] },
  step2: { causes: [], interests: [], preferredActivities: [] },
  step3: {
    volunteerType: '' as never,
    availabilityPattern: '' as never,
    hoursPerWeek: 0,
    sessionDuration: 0,
  },
  step4: { education: '', occupation: '', experience: '', certifications: [] },
  step5: { bio: '', avatarUrl: '', socialLinks: {} },
};

const STEP_FIELDS: Record<string, string[]> = {
  step1: ['skills', 'expertise', 'languages'],
  step2: ['causes', 'interests', 'preferredActivities'],
  step3: ['volunteerType', 'availabilityPattern', 'hoursPerWeek', 'sessionDuration'],
  step4: ['education', 'occupation', 'experience', 'certifications'],
  step5: ['bio', 'avatarUrl', 'socialLinks'],
};

export default function SetupProfilePage() {
  const router = useRouter();
  const { user, isLoading, refetch } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<OnboardingData>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues,
  });

  // Load draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as OnboardingData;
        reset(parsed);
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

  const handleNext = async () => {
    if (await validateStep(step)) {
      goToStep(step + 1);
    }
  };

  const handleBack = () => {
    goToStep(step - 1);
  };

  const handleComplete = async () => {
    localStorage.removeItem(DRAFT_KEY);
    await refetch();
    router.push(ROLE_ROUTES[user?.role ?? ''] ?? '/login');
  };

  const validateStep = async (stepIndex: number): Promise<boolean> => {
    const stepKey = STEP_KEYS[stepIndex];
    const fields = STEP_FIELDS[stepKey];
    const results = await Promise.all(
      fields.map((field) => trigger(`${stepKey}.${field}` as never))
    );
    const valid = results.every(Boolean);
    if (!valid) {
      toast({ title: 'Please fix the highlighted fields', variant: 'destructive' });
    }
    return valid;
  };

  const handleSubmitForm = async () => {
    for (let i = 0; i < STEPS.length; i++) {
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
      await api.post('/users/me/onboarding', data);
      toast({ title: 'Profile saved! Welcome to WeTheYuva.', variant: 'default' });
      await handleComplete();
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
  const CurrentStepComponent = [
    StepSkills,
    StepInterests,
    StepAvailability,
    StepEducation,
    StepBio,
  ][step];
  const stepProps = { register, setValue, watch, errors };

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
          <CurrentStepComponent {...stepProps} />
        </section>

        {formError && (
          <div
            className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400"
            role="alert"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="flex-1">{formError}</p>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-red-500 hover:text-red-700 cursor-pointer shrink-0 p-2 min-w-11 min-h-11"
              aria-label="Dismiss error"
            >
              <span aria-hidden>&times;</span>
            </button>
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

const StaffProfileSchema = z.object({
  locationName: z.string().min(1, 'Location name is required'),
  district: z.string().optional(),
  state: z.string().optional(),
});

type StaffProfileInput = z.infer<typeof StaffProfileSchema>;

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
