'use client';

import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ASPIRATIONS } from '@/lib/shared';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const ALL_SKILLS = [
  'Teaching',
  'Mentoring',
  'Event Planning',
  'Fundraising',
  'Social Media',
  'Photography',
  'Writing',
  'Design',
  'Data Entry',
  'Translation',
  'Cooking',
  'Gardening',
  'First Aid',
  'Counselling',
  'Coaching',
  'Advocacy',
  'Research',
  'Accounting',
  'Legal',
  'Healthcare',
];

const ALL_INTERESTS = [
  'Education',
  'Health',
  'Environment',
  'Community',
  'Arts & Culture',
  'Sports',
  'Technology',
  'Animal Welfare',
  'Disaster Relief',
  'Youth Development',
  'Senior Care',
  'Women Empowerment',
  'Livelihood',
  'Rural Development',
];

function PillSelector({
  label,
  options,
  selected,
  onToggle,
  max,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  max: number;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-brand-muted">
        {label} (select up to {max})
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          const atLimit = selected.length >= max && !isSelected;
          return (
            <button
              key={opt}
              type="button"
              disabled={atLimit}
              aria-pressed={isSelected}
              onClick={() => onToggle(opt)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${
                  isSelected
                    ? 'bg-brand-bg border-2 border-brand-primary text-brand-primary shadow-sm'
                    : atLimit
                      ? 'bg-muted text-muted-foreground cursor-not-allowed border-2 border-transparent'
                      : 'bg-muted text-muted-foreground hover:bg-accent border-2 border-transparent'
                }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const assessmentSchema = z.object({
  aspirations: z.array(z.string()).min(1, 'Please select at least one aspiration'),
  learningGoals: z.string().optional(),
  skills: z.array(z.string()).min(1, 'Please select at least one skill'),
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
});

export default function YouthAssessmentPage() {
  const router = useRouter();
  const { user, refetch } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [checking, setChecking] = useState(true);
  const form = useForm({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      aspirations: [] as string[],
      learningGoals: '',
      skills: [] as string[],
      interests: [] as string[],
    },
  });
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const aspirations = watch('aspirations');
  const learningGoals = watch('learningGoals');
  const skills = watch('skills');
  const interests = watch('interests');

  useEffect(() => {
    api
      .get('/youth-profiles/me')
      .then((res) => {
        if (res.data?.initialCompletedAt) {
          toast({ title: 'Assessment already completed' });
          router.push('/volunteer/dashboard');
        }
      })
      .catch(() => {
        /* no profile yet — first time */
      })
      .finally(() => setChecking(false));
  }, [router, toast]);

  useEffect(() => {
    if (form.formState.isDirty) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [form.formState.isDirty]);

  if (checking) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2
          className="w-6 h-6 text-brand-primary animate-spin"
          role="status"
          aria-label="Checking status"
        />
      </div>
    );
  }

  const toggleAspiration = (v: string) => {
    const current = form.getValues('aspirations');
    if (current.includes(v)) {
      setValue(
        'aspirations',
        current.filter((x: string) => x !== v)
      );
    } else if (current.length < 5) {
      setValue('aspirations', [...current, v]);
    }
  };

  const toggleSkill = (v: string) => {
    const current = form.getValues('skills');
    if (current.includes(v)) {
      setValue(
        'skills',
        current.filter((x: string) => x !== v)
      );
    } else if (current.length < 10) {
      setValue('skills', [...current, v]);
    }
  };

  const toggleInterest = (v: string) => {
    const current = form.getValues('interests');
    if (current.includes(v)) {
      setValue(
        'interests',
        current.filter((x: string) => x !== v)
      );
    } else if (current.length < 10) {
      setValue('interests', [...current, v]);
    }
  };

  const steps = [
    {
      id: 'learn',
      title: 'What do you want to learn?',
      subtitle: 'Select the skills and areas you hope to develop through volunteering',
      content: (
        <div className="space-y-6">
          <PillSelector
            label="Aspirations"
            options={ASPIRATIONS}
            selected={aspirations}
            onToggle={toggleAspiration}
            max={5}
          />
          {errors.aspirations && (
            <p role="alert" className="text-xs text-brand-error">
              {errors.aspirations.message}
            </p>
          )}
          <div className="space-y-2">
            <label htmlFor="learning-goals" className="text-sm font-medium text-brand-muted">
              Learning goals (optional)
            </label>
            <textarea
              id="learning-goals"
              {...register('learningGoals')}
              disabled={loading}
              placeholder="What do you hope to gain from your volunteering journey?"
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-brand-border bg-background px-4 py-3 text-sm
                placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/40 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{learningGoals.length}/500</p>
          </div>
        </div>
      ),
      canProceed: aspirations.length > 0,
    },
    {
      id: 'skills',
      title: 'What skills can you bring?',
      subtitle: 'Select the skills you already have',
      content: (
        <div className="space-y-2">
          <PillSelector
            label="Skills"
            options={ALL_SKILLS}
            selected={skills}
            onToggle={toggleSkill}
            max={10}
          />
          {errors.skills && (
            <p role="alert" className="text-xs text-brand-error">
              {errors.skills.message}
            </p>
          )}
        </div>
      ),
      canProceed: skills.length > 0,
    },
    {
      id: 'passion',
      title: 'What are you passionate about?',
      subtitle: 'Select the causes that matter most to you',
      content: (
        <div className="space-y-2">
          <PillSelector
            label="Interests"
            options={ALL_INTERESTS}
            selected={interests}
            onToggle={toggleInterest}
            max={10}
          />
          {errors.interests && (
            <p role="alert" className="text-xs text-brand-error">
              {errors.interests.message}
            </p>
          )}
        </div>
      ),
      canProceed: interests.length > 0,
    },
  ];

  const onSubmit = async (data: z.infer<typeof assessmentSchema>) => {
    setLoading(true);
    try {
      await api.post('/youth-profiles/me/initial', {
        aspirations: data.aspirations,
        learningGoals: data.learningGoals || undefined,
        skills: data.skills,
        interests: data.interests,
      });
      await refetch();
      toast({ title: 'Assessment saved!' });
      const roleRoutes: Record<string, string> = {
        VOLUNTEER: '/volunteer/dashboard',
        COORDINATOR: '/coordinator/dashboard',
        ADMIN: '/admin/dashboard',
        PLATFORM_MANAGER: '/admin/dashboard',
        OBSERVER: '/observer/dashboard',
        ORGANIZATION_ADMIN: '/organization/dashboard',
      };
      router.push(roleRoutes[user?.role ?? ''] ?? '/login');
    } catch (err) {
      const message =
        (err as { normalizedMessage?: string; response?: { data?: { error?: string } } })
          ?.normalizedMessage ??
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to save assessment';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const current = steps[step];

  return (
    <form onSubmit={rhfHandleSubmit(onSubmit)} className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-bg mb-2">
            <Sparkles className="w-6 h-6 text-brand-primary" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-brand-text">{current.title}</h1>
          <p className="text-brand-muted text-sm">{current.subtitle}</p>
          {/* Step indicator */}
          <div className="flex justify-center gap-1.5 pt-2">
            {steps.map((s, idx) => (
              <div
                key={s.id}
                role="img"
                aria-current={idx === step ? 'step' : undefined}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? 'w-8 bg-brand-primary' : idx < step ? 'w-4 bg-brand-primary/40' : 'w-4 bg-muted'}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        {current.content}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
              Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!current.canProceed}
              className="flex-1"
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              loading={loading}
              disabled={!current.canProceed}
              className="flex-1"
            >
              Complete Assessment <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
