'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LevelBadge } from '@/components/levels/LevelBadge';
import { ProofUploadForm } from '@/components/levels/ProofUploadForm';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';

const TIER_DATA = [
  {
    tier: 1,
    name: 'Sprout',
    badgeIcon: 'Sprout',
    color: 'from-green-400 to-emerald-600',
    gradient: 'from-green-400 to-emerald-600',
    badgeShape: 'circle' as const,
  },
  {
    tier: 2,
    name: 'Volunteer',
    badgeIcon: 'Users',
    color: 'from-blue-400 to-indigo-600',
    gradient: 'from-blue-400 to-indigo-600',
    badgeShape: 'hexagon' as const,
  },
  {
    tier: 3,
    name: 'Contributor',
    badgeIcon: 'Wrench',
    color: 'from-purple-400 to-violet-600',
    gradient: 'from-purple-400 to-violet-600',
    badgeShape: 'shield' as const,
  },
  {
    tier: 4,
    name: 'Champion',
    badgeIcon: 'Crown',
    color: 'from-amber-400 to-orange-600',
    gradient: 'from-amber-400 to-orange-600',
    badgeShape: 'star' as const,
  },
];

interface LevelDefinition {
  id: string;
  tier: number;
  name: string;
  badgeIcon: string;
  color: string;
  badgeShape: string;
  pointsRequired: number;
  requirements: Record<string, number>;
}

export default function LevelRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [proofUrls, setProofUrls] = useState<string[]>([]);

  const { data: levelRes, isLoading: levelLoading } = useQuery<{ data: { tier: number } }>({
    queryKey: ['my-level'],
    queryFn: () => api.get('/levels/users/me/level').then((r) => r.data),
  });

  const { data: levelsRes, isLoading: levelsLoading } = useQuery<{ data: LevelDefinition[] }>({
    queryKey: ['levels'],
    queryFn: () => api.get('/levels').then((r) => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (body: { levelId: string; notes?: string; proofUrls?: string[] }) =>
      api.post(`/levels/${body.levelId}/request`, { notes: body.notes, proofUrls: body.proofUrls }),
    onSuccess: (res) => {
      const requestId = res?.data?.data?.id;
      toast({ title: 'Level-up request submitted!' });
      router.push(`/volunteer/levels/request/${requestId}/success`);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast({
        title: 'Failed',
        description: err?.response?.data?.error ?? 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const currentTier = levelRes?.data?.tier ?? 0;
  const levels = levelsRes?.data ?? [];
  const requestableLevels = levels.filter((l) => l.tier > currentTier);

  function handleSubmit() {
    if (!selectedLevel) return;
    haptic.medium();
    submitMutation.mutate({
      levelId: selectedLevel,
      notes: notes || undefined,
      proofUrls: proofUrls.length > 0 ? proofUrls : undefined,
    });
  }

  if (levelLoading || levelsLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/volunteer/levels"
          onClick={() => haptic.light()}
          className="w-9 h-9 rounded-xl border border-brand-border flex items-center justify-center hover:bg-brand-bg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-brand-muted" />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-xl text-brand-text">Request Level-Up</h1>
          <p className="text-brand-muted text-sm mt-0.5">
            Select the level you want to advance to.
          </p>
        </div>
      </div>

      {requestableLevels.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-8 text-center">
          <p className="text-brand-muted text-sm">
            You&apos;ve reached the maximum level. No more levels to request.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requestableLevels.map((lvl) => {
            const tierInfo = TIER_DATA[lvl.tier - 1] ?? TIER_DATA[0];
            const isOpen = selectedLevel === lvl.id;
            return (
              <div
                key={lvl.id}
                className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setSelectedLevel(isOpen ? null : lvl.id);
                    setProofUrls([]);
                    setNotes('');
                  }}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-brand-bg/50 transition-colors cursor-pointer"
                >
                  <LevelBadge
                    tier={tierInfo.tier}
                    name={tierInfo.name}
                    badgeIcon={tierInfo.badgeIcon}
                    color={tierInfo.gradient}
                    badgeShape={tierInfo.badgeShape}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-brand-text">{tierInfo.name}</p>
                    <p className="text-xs text-brand-muted">
                      Tier {lvl.tier} · {lvl.pointsRequired} points required
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-brand-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-brand-muted" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-5 border-t border-brand-border pt-4">
                    {/* Requirements summary */}
                    {lvl.requirements && Object.keys(lvl.requirements).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-brand-text">Required Criteria</p>
                        <ul className="space-y-1">
                          {Object.entries(lvl.requirements).map(([key, val]) => (
                            <li
                              key={key}
                              className="text-sm text-brand-muted flex items-center gap-2"
                            >
                              <Check className="w-3.5 h-3.5 text-brand-primary" />
                              <span className="capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              : <span className="font-medium text-brand-text">{val}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <label htmlFor="notes" className="block text-sm font-medium text-brand-text">
                        Notes (optional)
                      </label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Add any additional information for the reviewer..."
                        className="w-full text-sm border border-brand-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                    </div>

                    {/* Proof upload */}
                    <ProofUploadForm onFilesChange={setProofUrls} />

                    {/* Submit */}
                    <Button fullWidth onClick={handleSubmit} loading={submitMutation.isPending}>
                      <Send className="w-4 h-4" /> Submit Request
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
