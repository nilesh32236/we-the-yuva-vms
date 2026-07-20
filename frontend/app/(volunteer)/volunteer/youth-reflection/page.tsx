'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Sparkles, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GROWTH_AREAS } from '@/lib/shared';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const SKILL_SUGGESTIONS = [
  'Teaching',
  'Mentoring',
  'Public Speaking',
  'Event Planning',
  'Teamwork',
  'Leadership',
  'Communication',
  'Problem Solving',
  'Time Management',
  'Advocacy',
  'Project Management',
  'Data Analysis',
  'Community Outreach',
  'Counselling',
  'First Aid',
];

const reflectionSchema = z.object({
  skillsDeveloped: z.array(z.string()).min(1, 'Please select at least one skill'),
  growthAreas: z.array(z.string()).min(1, 'Please select at least one growth area'),
  confidenceLevel: z.number().min(1, 'Please select a confidence level'),
  impactDescription: z.string().optional(),
});

export default function YouthReflectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const form = useForm({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      skillsDeveloped: [] as string[],
      growthAreas: [] as string[],
      confidenceLevel: 0,
      impactDescription: '',
    },
  });
  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;
  const skillsDeveloped = watch('skillsDeveloped');
  const growthAreas = watch('growthAreas');
  const confidenceLevel = watch('confidenceLevel');
  const impactDescription = watch('impactDescription');

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['youth-profile'],
    queryFn: () => api.get('/youth-profiles/me').then((r) => r.data),
  });

  const alreadyReflected = profileRes?.reflectionCompletedAt != null;

  useEffect(() => {
    if (profileRes?.reflectionResponses) {
      const r = profileRes.reflectionResponses;
      reset({
        skillsDeveloped: r.skillsDeveloped ?? [],
        growthAreas: r.growthAreas ?? [],
        confidenceLevel: r.confidenceLevel ?? 0,
        impactDescription: r.impactDescription ?? '',
      });
    }
  }, [profileRes, reset]);

  const mutation = useMutation({
    mutationFn: (data: unknown) => api.post('/youth-profiles/me/reflect', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['youth-profile'] });
      toast({ title: alreadyReflected ? 'Reflection updated!' : 'Reflection submitted!' });
      router.push('/volunteer/levels');
    },
    onError: () => {
      toast({ title: 'Failed to save reflection', variant: 'destructive' });
    },
  });

  const toggleSkill = (v: string) => {
    const current = form.getValues('skillsDeveloped');
    if (current.includes(v)) {
      setValue(
        'skillsDeveloped',
        current.filter((x: string) => x !== v)
      );
    } else if (current.length < 10) {
      setValue('skillsDeveloped', [...current, v]);
    }
  };

  const toggleGrowth = (v: string) => {
    const current = form.getValues('growthAreas');
    if (current.includes(v)) {
      setValue(
        'growthAreas',
        current.filter((x: string) => x !== v)
      );
    } else if (current.length < 5) {
      setValue('growthAreas', [...current, v]);
    }
  };

  const canSubmit = skillsDeveloped.length > 0 && growthAreas.length > 0 && confidenceLevel > 0;

  if (isLoading)
    return (
      <div className="max-w-xl mx-auto py-8">
        <SkeletonCard />
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit((data) =>
        mutation.mutate({
          skillsDeveloped: data.skillsDeveloped,
          growthAreas: data.growthAreas,
          confidenceLevel: data.confidenceLevel,
          impactDescription: data.impactDescription || undefined,
        })
      )}
      className="max-w-xl mx-auto py-8 px-4 space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-primary/10 mb-2">
          <Sparkles className="w-6 h-6 text-brand-primary" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-brand-text">
          {alreadyReflected ? 'Update your reflection' : 'Reflect on your journey'}
        </h1>
        <p className="text-brand-muted text-sm">
          Look back at how far you&apos;ve come. What changed? What did you learn?
        </p>
      </div>

      <div className="space-y-6">
        {/* Skills Developed */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-brand-muted">
            Skills you developed{' '}
            <span className="text-brand-error" aria-hidden="true">
              *
            </span>
          </p>
          <fieldset className="flex flex-wrap gap-2" aria-label="Skills developed">
            {SKILL_SUGGESTIONS.map((s) => {
              const isSelected = skillsDeveloped.includes(s);
              const atLimit = skillsDeveloped.length >= 10 && !isSelected;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={atLimit}
                  aria-pressed={isSelected}
                  aria-invalid={!!errors.skillsDeveloped}
                  onClick={() => toggleSkill(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${
                      isSelected
                        ? 'bg-brand-bg border-2 border-brand-primary text-brand-primary shadow-sm'
                        : atLimit
                          ? 'bg-muted text-muted-foreground cursor-not-allowed border-2 border-transparent'
                          : 'bg-muted text-muted-foreground hover:bg-accent border-2 border-transparent'
                    }${errors.skillsDeveloped ? ' border-brand-error' : ''}`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {s}
                </button>
              );
            })}
          </fieldset>
          {errors.skillsDeveloped && (
            <p role="alert" className="text-xs text-brand-error">
              {errors.skillsDeveloped.message}
            </p>
          )}
        </div>

        {/* Growth Areas */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-brand-muted">
            Areas where you grew{' '}
            <span className="text-brand-error" aria-hidden="true">
              *
            </span>
          </p>
          <fieldset className="flex flex-wrap gap-2" aria-label="Growth areas">
            {GROWTH_AREAS.map((g) => {
              const isSelected = growthAreas.includes(g);
              const atLimit = growthAreas.length >= 5 && !isSelected;
              return (
                <button
                  key={g}
                  type="button"
                  disabled={atLimit}
                  aria-pressed={isSelected}
                  aria-invalid={!!errors.growthAreas}
                  onClick={() => toggleGrowth(g)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${
                      isSelected
                        ? 'bg-brand-primary/10 border-2 border-brand-primary text-brand-primary shadow-sm'
                        : atLimit
                          ? 'bg-muted text-muted-foreground cursor-not-allowed border-2 border-transparent'
                          : 'bg-muted text-muted-foreground hover:bg-accent border-2 border-transparent'
                    }${errors.growthAreas ? ' border-brand-error' : ''}`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {g}
                </button>
              );
            })}
          </fieldset>
          {errors.growthAreas && (
            <p role="alert" className="text-xs text-brand-error">
              {errors.growthAreas.message}
            </p>
          )}
        </div>

        {/* Confidence Level */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-brand-muted">
            Confidence level <span className="text-brand-error">*</span>
          </p>
          <div
            className="flex gap-1"
            role="radiogroup"
            aria-required="true"
            aria-label="Confidence level"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              // biome-ignore lint/a11y/useSemanticElements: custom star rating using radiogroup pattern
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={confidenceLevel >= star}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                aria-invalid={!!errors.confidenceLevel}
                onClick={() => setValue('confidenceLevel', star)}
                className={`cursor-pointer p-2.5${errors.confidenceLevel ? ' rounded-lg ring-2 ring-brand-error' : ''}`}
              >
                <Star
                  className={`w-8 h-8 transition-all ${
                    confidenceLevel >= star ? 'fill-amber-400 text-amber-400' : 'text-brand-border'
                  }`}
                />
              </button>
            ))}
          </div>
          {errors.confidenceLevel && (
            <p role="alert" className="text-xs text-brand-error">
              {errors.confidenceLevel.message}
            </p>
          )}
          <p className="text-xs text-brand-muted">
            {confidenceLevel === 0 && 'Tap a star'}
            {confidenceLevel === 1 && 'Need more support'}
            {confidenceLevel === 2 && 'A bit more confident'}
            {confidenceLevel === 3 && 'Moderately confident'}
            {confidenceLevel === 4 && 'Quite confident'}
            {confidenceLevel === 5 && 'Very confident!'}
          </p>
        </div>

        {/* Impact Description */}
        <div className="space-y-2">
          <label htmlFor="impact-description" className="text-sm font-medium text-brand-muted">
            Describe your impact (optional)
          </label>
          <textarea
            id="impact-description"
            {...form.register('impactDescription')}
            placeholder="How did your volunteering make a difference? What moments stood out?"
            rows={4}
            maxLength={1000}
            className="w-full rounded-xl border border-brand-border bg-background px-4 py-3 text-sm
              placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/40 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {impactDescription.length}/1000
          </p>
        </div>
      </div>

      <Button type="submit" loading={mutation.isPending} disabled={!canSubmit} className="w-full">
        {alreadyReflected ? 'Update Reflection' : 'Submit Reflection'}{' '}
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </form>
  );
}
