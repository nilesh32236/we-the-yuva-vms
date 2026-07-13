// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BellRing, Plus, Tag, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const alertSchema = z.object({
  categories: z.array(z.string()),
  skills: z.array(z.string()),
});

const CATEGORIES = [
  'EDUCATION',
  'HEALTH',
  'ENVIRONMENT',
  'COMMUNITY',
  'ARTS',
  'SPORTS',
  'TECHNOLOGY',
  'ACTIVE_CITIZENSHIP',
  'OTHER',
];

const CATEGORY_COLORS: Record<string, string> = {
  EDUCATION: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  HEALTH: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  ENVIRONMENT: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  COMMUNITY: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  ARTS: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  SPORTS: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  TECHNOLOGY: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  ACTIVE_CITIZENSHIP: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  OTHER: 'bg-muted text-muted-foreground',
};

export default function AlertSubscriptionsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const { watch, setValue, reset, handleSubmit } = useForm<z.infer<typeof alertSchema>>({
    resolver: zodResolver(alertSchema),
    defaultValues: { categories: [], skills: [] },
  });

  const selectedCats = watch('categories');
  const skills = watch('skills');

  const { data: subs, isLoading } = useQuery({
    queryKey: ['alert-subscriptions'],
    queryFn: () => api.get('/alerts').then((r) => r.data),
    staleTime: 30_000,
  });

  const createMut = useMutation({
    mutationFn: (data: { categories: string[]; skills: string[] }) => api.post('/alerts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alert-subscriptions'] });
      toast({ title: 'Alert created' });
      setShowForm(false);
      reset();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not create alert';
      toast({ title: 'Failed', description: message, variant: 'destructive' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alert-subscriptions'] });
      toast({ title: 'Alert removed' });
    },
  });

  const toggleCat = (cat: string) => {
    const next = selectedCats.includes(cat)
      ? selectedCats.filter((c) => c !== cat)
      : [...selectedCats, cat];
    setValue('categories', next);
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/volunteer/profile"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-brand-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl text-brand-text">
                  Alert Subscriptions
                </h1>
                <p className="text-xs text-brand-muted mt-0.5">
                  Get notified when new opportunities match your interests
                </p>
              </div>
            </div>
            {!showForm && (
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> New Alert
              </Button>
            )}
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div role="status" aria-busy="true" className="space-y-3">
              {[1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : showForm ? (
            /* New alert form */
            <form
              onSubmit={handleSubmit((data) => {
                haptic.medium();
                createMut.mutate(data);
              })}
              className="bg-brand-bg rounded-xl p-5 space-y-4 border border-brand-border"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand-text">Create Alert Subscription</h3>
                <button
                  type="button"
                  aria-label="Close form"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                  }}
                  className="min-w-11 min-h-11 rounded-lg flex items-center justify-center text-brand-muted hover:bg-brand-surface cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-brand-muted uppercase tracking-wider">
                  Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCat(cat)}
                      disabled={createMut.isPending}
                      aria-pressed={selectedCats.includes(cat)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150 cursor-pointer
                        ${
                          selectedCats.includes(cat)
                            ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                            : 'bg-brand-surface text-brand-muted border-brand-border hover:border-brand-primary hover:text-brand-text'
                        }`}
                    >
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                {selectedCats.length === 0 && (
                  <p className="text-[10px] text-brand-muted italic">
                    Leave empty to match all categories
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="alert-skills"
                  className="text-xs font-medium text-brand-muted uppercase tracking-wider"
                >
                  Skills (optional)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 bg-brand-surface border border-brand-border text-xs px-2.5 py-1 rounded-full text-brand-text"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() =>
                          setValue(
                            'skills',
                            skills.filter((x) => x !== s)
                          )
                        }
                        className="cursor-pointer text-brand-muted hover:text-brand-text"
                        aria-label={`Remove ${s}`}
                        disabled={createMut.isPending}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
                    <input
                      id="alert-skills"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      disabled={createMut.isPending}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
                          e.preventDefault();
                          setValue('skills', [...skills, skillInput.trim()]);
                          setSkillInput('');
                        }
                      }}
                      placeholder="Add skill, press Enter..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  disabled={createMut.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={createMut.isPending}
                >
                  <BellRing className="w-3.5 h-3.5" /> Create Alert
                </Button>
              </div>
            </form>
          ) : !subs?.length ? (
            /* Empty state */
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-4">
                <BellRing className="w-6 h-6 text-brand-muted" />
              </div>
              <p className="font-medium text-brand-text">No alert subscriptions yet</p>
              <p className="text-sm text-brand-muted mt-1">
                Create an alert to get notified when new opportunities match your interests
              </p>
            </div>
          ) : (
            /* Alert list */
            <div className="space-y-3">
              {subs?.map(
                (s: { id: string; categories: string[]; skills: string[]; isActive: boolean }) => (
                  <div
                    key={s.id}
                    className="flex items-start justify-between gap-3 p-4 rounded-xl border border-brand-border hover:bg-brand-bg/50 transition-colors"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      {s.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {s.categories.map((c) => (
                            <span
                              key={c}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[c] ?? CATEGORY_COLORS.OTHER}`}
                            >
                              {c.charAt(0) + c.slice(1).toLowerCase()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                          All categories
                        </span>
                      )}
                      {s.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.skills.map((skill) => (
                            <span
                              key={skill}
                              className="text-xs bg-brand-bg border border-brand-border px-2 py-0.5 rounded-full text-brand-muted"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.light();
                        deleteMut.mutate(s.id);
                      }}
                      className="p-2.5 rounded-lg text-brand-muted hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-brand-error transition-colors cursor-pointer shrink-0"
                      aria-label="Remove alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
