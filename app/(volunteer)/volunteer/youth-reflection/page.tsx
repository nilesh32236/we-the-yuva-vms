'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Sparkles, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { GROWTH_AREAS, YouthReflectionSchema } from '@/lib/shared';
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

export default function YouthReflectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [skillsDeveloped, setSkillsDeveloped] = useState<string[]>([]);
  const [growthAreas, setGrowthAreas] = useState<string[]>([]);
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [impactDescription, setImpactDescription] = useState('');

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['youth-profile'],
    queryFn: () => api.get('/youth-profiles/me').then((r) => r.data),
  });

  const alreadyReflected = profileRes?.reflectionCompletedAt != null;

  useEffect(() => {
    if (profileRes?.reflectionResponses) {
      const r = profileRes.reflectionResponses;
      setSkillsDeveloped(r.skillsDeveloped ?? []);
      setGrowthAreas(r.growthAreas ?? []);
      setConfidenceLevel(r.confidenceLevel ?? 0);
      setImpactDescription(r.impactDescription ?? '');
    }
  }, [profileRes]);

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

  const toggleSkill = (v: string) =>
    setSkillsDeveloped((p) =>
      p.includes(v) ? p.filter((x) => x !== v) : p.length < 10 ? [...p, v] : p
    );

  const toggleGrowth = (v: string) =>
    setGrowthAreas((p) =>
      p.includes(v) ? p.filter((x) => x !== v) : p.length < 5 ? [...p, v] : p
    );

  const canSubmit = skillsDeveloped.length > 0 && growthAreas.length > 0 && confidenceLevel > 0;

  if (isLoading)
    return (
      <div className="max-w-xl mx-auto py-8">
        <SkeletonCard />
      </div>
    );

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 mb-2">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
            Skills you developed <span className="text-red-500 dark:text-red-400">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {SKILL_SUGGESTIONS.map((s) => {
              const isSelected = skillsDeveloped.includes(s);
              const atLimit = skillsDeveloped.length >= 10 && !isSelected;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={atLimit}
                  onClick={() => toggleSkill(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${
                      isSelected
                        ? 'bg-brand-bg border-2 border-brand text-brand shadow-sm'
                        : atLimit
                          ? 'bg-muted text-muted-foreground cursor-not-allowed border-2 border-transparent'
                          : 'bg-muted text-muted-foreground hover:bg-accent border-2 border-transparent'
                    }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Growth Areas */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-brand-muted">
            Areas where you grew <span className="text-red-500 dark:text-red-400">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {GROWTH_AREAS.map((g) => {
              const isSelected = growthAreas.includes(g);
              const atLimit = growthAreas.length >= 5 && !isSelected;
              return (
                <button
                  key={g}
                  type="button"
                  disabled={atLimit}
                  onClick={() => toggleGrowth(g)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${
                      isSelected
                        ? 'bg-purple-50 border-2 border-purple-500 text-purple-700 shadow-sm'
                        : atLimit
                          ? 'bg-muted text-muted-foreground cursor-not-allowed border-2 border-transparent'
                          : 'bg-muted text-muted-foreground hover:bg-accent border-2 border-transparent'
                    }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confidence Level */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-brand-muted">
            Confidence level <span className="text-red-500 dark:text-red-400">*</span>
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setConfidenceLevel(star)}
                className="cursor-pointer p-1"
              >
                <Star
                  className={`w-8 h-8 transition-all ${
                    confidenceLevel >= star ? 'fill-amber-400 text-amber-400' : 'text-brand-border'
                  }`}
                />
              </button>
            ))}
          </div>
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
          <p className="text-sm font-medium text-brand-muted">Describe your impact (optional)</p>
          <textarea
            value={impactDescription}
            onChange={(e) => setImpactDescription(e.target.value)}
            placeholder="How did your volunteering make a difference? What moments stood out?"
            rows={4}
            maxLength={1000}
            className="w-full rounded-xl border border-brand-border bg-background px-4 py-3 text-sm
              placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {impactDescription.length}/1000
          </p>
        </div>
      </div>

      <Button
        onClick={() =>
          mutation.mutate(
            YouthReflectionSchema.parse({
              skillsDeveloped,
              growthAreas,
              confidenceLevel,
              impactDescription: impactDescription || undefined,
            })
          )
        }
        loading={mutation.isPending}
        disabled={!canSubmit}
        className="w-full"
      >
        {alreadyReflected ? 'Update Reflection' : 'Submit Reflection'}{' '}
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
