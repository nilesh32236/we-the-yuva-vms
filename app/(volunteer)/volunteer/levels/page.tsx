'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowUp,
  Award,
  CheckCircle,
  Clock,
  ExternalLink,
  Flame,
  Medal,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { LevelBadge } from '@/components/levels/LevelBadge';
import { RequirementChecklist } from '@/components/levels/RequirementChecklist';
import { StreakBadge } from '@/components/levels/StreakBadge';
import { TierPathVisualizer } from '@/components/levels/TierPathVisualizer';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useAuth } from '@/hooks/useAuth';
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
    badgeShape: 'circle',
  },
  {
    tier: 2,
    name: 'Volunteer',
    badgeIcon: 'Users',
    color: 'from-blue-400 to-indigo-600',
    gradient: 'from-blue-400 to-indigo-600',
    badgeShape: 'hexagon',
  },
  {
    tier: 3,
    name: 'Contributor',
    badgeIcon: 'Wrench',
    color: 'from-purple-400 to-violet-600',
    gradient: 'from-purple-400 to-violet-600',
    badgeShape: 'shield',
  },
  {
    tier: 4,
    name: 'Champion',
    badgeIcon: 'Crown',
    color: 'from-amber-400 to-orange-600',
    gradient: 'from-amber-400 to-orange-600',
    badgeShape: 'star',
  },
];

interface LevelData {
  tier: number;
  points: number;
  pointsToNext: number;
  streak: number;
  hoursVolunteered: number;
  nextLevel: {
    name: string;
    pointsRequired: number;
    requirements: Record<string, number>;
    levelId: string;
  } | null;
}

interface ProgressData {
  currentTier: number;
  eventsAttended: number;
  hoursVolunteered: number;
  endorsements: number;
  citizensImpacted: number;
  participations: number;
}

interface RequestRecord {
  id: string;
  requestedLevel: string;
  status: string;
  createdAt: string;
  reviewNote?: string;
}

export default function VolunteerLevelsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const {
    data: levelRes,
    isLoading: levelLoading,
    isError: isLevelError,
  } = useQuery<{ data: LevelData }>({
    queryKey: ['my-level'],
    queryFn: () => api.get('/levels/users/me/level').then((r) => r.data),
  });

  const {
    data: progressRes,
    isLoading: progressLoading,
    isError: isProgressError,
  } = useQuery<{ data: ProgressData }>({
    queryKey: ['my-level-progress'],
    queryFn: () => api.get('/levels/users/me/level/progress').then((r) => r.data),
  });

  const {
    data: requestsRes,
    isLoading: requestsLoading,
    isError: isRequestsError,
  } = useQuery<{ data: RequestRecord[] }>({
    queryKey: ['my-level-requests'],
    queryFn: () => api.get('/levels/users/me/level/requests').then((r) => r.data),
  });

  const { data: youthProfileRes } = useQuery({
    queryKey: ['youth-profile'],
    queryFn: () => api.get('/youth-profiles/me').then((r) => r.data),
    enabled: !!user,
  });

  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/levels/requests/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-level-requests'] });
      toast({ title: 'Request cancelled' });
      setCancellingId(null);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast({
        title: 'Failed',
        description: err?.response?.data?.error ?? 'Something went wrong',
        variant: 'destructive',
      });
      setCancellingId(null);
    },
  });

  const requestMutation = useMutation({
    mutationFn: ({ levelId, notes }: { levelId: string; notes: string }) =>
      api.post(`/levels/${levelId}/request`, { notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-level-requests'] });
      qc.invalidateQueries({ queryKey: ['my-level'] });
      toast({ title: 'Level-up request submitted!' });
      setShowRequestDialog(false);
      setRequestNotes('');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast({
        title: 'Failed',
        description: err?.response?.data?.error ?? 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const level = levelRes?.data;
  const progress = progressRes?.data;
  const requests = requestsRes?.data ?? [];

  // Backend is 0-indexed, TIER_DATA is 1-indexed — subtract 1 to align
  const currentTier = TIER_DATA[(level?.tier ?? 1) - 1] ?? TIER_DATA[0];
  const isMaxLevel = (level?.tier ?? 0) >= TIER_DATA.length;
  const progressPct =
    level && level.pointsToNext > 0
      ? Math.min((level.points / level.pointsToNext) * 100, 100)
      : 100;

  const allRequirementsMet = level?.nextLevel?.requirements
    ? Object.entries(level.nextLevel.requirements).every(([key, required]) => {
        const current =
          (progress as unknown as Record<string, number>)?.[key as keyof ProgressData] ?? 0;
        return current >= required;
      })
    : false;

  const hasPendingRequest = requests.some((r) => r.status === 'PENDING');

  if (isLevelError || isProgressError) {
    return (
      <div className="text-center py-8 text-destructive max-w-5xl">
        Failed to load level data. Please try again later.
      </div>
    );
  }

  if (levelLoading || progressLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-6 md:p-8">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -right-4 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">Your Level</p>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-white">
              {currentTier.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full">
                <Trophy className="w-3 h-3" /> Tier {currentTier.tier}
              </span>
              {level && (
                <Link
                  href="/volunteer/impact"
                  onClick={() => haptic.light()}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
                >
                  <Medal className="w-3 h-3" /> {level.points} pts
                </Link>
              )}
              {level && level.streak > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full">
                  <Flame className="w-3 h-3" /> {level.streak} day streak
                </span>
              )}
            </div>
          </div>
          <LevelBadge
            tier={currentTier.tier}
            name={currentTier.name}
            badgeIcon={currentTier.badgeIcon}
            color={currentTier.gradient}
            badgeShape={currentTier.badgeShape as 'circle' | 'hexagon' | 'shield' | 'star'}
            size="lg"
          />
        </div>
      </div>

      {/* Tier Path */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-sm text-brand-text">Level Progression</h2>
          <div className="flex gap-3">
            <Link
              href="/volunteer/leaderboard"
              onClick={() => haptic.light()}
              className="text-xs font-medium text-brand-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              View Leaderboard <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/volunteer/badges"
              onClick={() => haptic.light()}
              className="text-xs font-medium text-brand-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              View Badges <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
        <TierPathVisualizer levels={TIER_DATA} currentLevelId={String(level?.tier)} />
      </div>

      {/* Progress to next */}
      {!isMaxLevel && level && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-sm text-brand-text">
              Progress to {level.nextLevel?.name ?? 'Next Level'}
            </h2>
            <span className="text-sm font-semibold text-brand-text">
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="h-2.5 bg-brand-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-brand-muted">
            <span>
              <span className="font-semibold text-brand-text">{level.points}</span> /{' '}
              {level.pointsToNext} points
            </span>
            {level.streak > 0 && <StreakBadge streak={level.streak} />}
          </div>
        </div>
      )}

      {isMaxLevel && (
        <div className="bg-brand-surface rounded-2xl border border-amber-200 dark:border-amber-800 p-5 text-center">
          <Award className="w-10 h-10 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
          <p className="font-heading font-semibold text-brand-text">Maximum Level Reached!</p>
          <p className="text-sm text-brand-muted mt-1">
            You&apos;ve reached the highest tier. Keep up the great work!
          </p>
        </div>
      )}

      {/* Requirements + Request button */}
      {!isMaxLevel && level?.nextLevel && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-sm text-brand-text">
              Requirements for {level.nextLevel.name}
            </h2>
            {allRequirementsMet && !hasPendingRequest && (
              <Button
                size="sm"
                onClick={() => {
                  haptic.medium();
                  setShowRequestDialog(true);
                }}
              >
                <ArrowUp className="w-4 h-4" /> Request Level-Up
              </Button>
            )}
          </div>

          <RequirementChecklist
            requirements={level.nextLevel.requirements as Record<string, unknown>}
            progress={progress as unknown as Record<string, number>}
            levelName={level.nextLevel.name}
          />

          {!allRequirementsMet && (
            <p className="text-xs text-brand-muted">
              Complete all requirements above to request a level-up.
            </p>
          )}

          {allRequirementsMet && hasPendingRequest && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-2.5">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                You already have a pending request. Wait for it to be reviewed.
              </span>
            </div>
          )}

          {!allRequirementsMet && (
            <Link
              href="/volunteer/levels/request"
              onClick={() => haptic.light()}
              className="text-sm font-medium text-brand-primary hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              Upload proof manually <ArrowUp className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Level-Up Request Dialog */}
      {showRequestDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/50 cursor-pointer"
            onClick={() => setShowRequestDialog(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-brand-surface rounded-2xl border border-brand-border p-6 w-full max-w-md space-y-4"
          >
            <h3 className="font-heading font-semibold text-lg text-brand-text">Request Level-Up</h3>
            <p className="text-sm text-brand-muted">
              Provide any notes or proof to support your level-up request.
            </p>
            <textarea
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              placeholder="Describe what you've accomplished..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRequestDialog(false);
                  setRequestNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (level?.nextLevel)
                    requestMutation.mutate({
                      levelId: level.nextLevel.levelId,
                      notes: requestNotes,
                    });
                }}
                loading={requestMutation.isPending}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reflection prompt for max-level volunteers */}
      {isMaxLevel && !youthProfileRes?.reflectionCompletedAt && (
        <Link
          href="/volunteer/youth-reflection"
          onClick={() => haptic.light()}
          className="block bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl p-5 text-white hover:opacity-90 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-base">Reflect on your journey</h3>
              <p className="text-sm text-white/80 mt-0.5">
                You&apos;ve reached the highest level! Take a moment to reflect on what you&apos;ve
                learned and how you&apos;ve grown.
              </p>
            </div>
            <ArrowUp className="w-5 h-5 flex-shrink-0 mt-1" />
          </div>
        </Link>
      )}

      {/* Request History */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <h2 className="font-heading font-semibold text-sm text-brand-text">Request History</h2>
        </div>
        {isRequestsError ? (
          <div className="text-center py-8 text-destructive text-sm">
            Failed to load request history. Please try again later.
          </div>
        ) : requestsLoading ? (
          <div className="p-5">
            <SkeletonCard />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-brand-muted text-sm">No level-up requests yet.</div>
        ) : (
          <div className="divide-y divide-brand-border">
            {requests.map((req) => (
              <div key={req.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    {req.status === 'APPROVED' ? (
                      <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                    ) : req.status === 'REJECTED' ? (
                      <XCircle className="w-5 h-5 text-brand-error" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">
                      {req.requestedLevel}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {new Date(req.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    {req.reviewNote && (
                      <p className="text-xs text-brand-muted mt-0.5 italic">
                        &ldquo;{req.reviewNote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {req.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Cancel this level-up request?')) {
                          setCancellingId(req.id);
                          cancelMutation.mutate(req.id);
                        }
                      }}
                      disabled={cancellingId === req.id}
                      className="text-xs font-medium text-brand-error hover:underline disabled:opacity-50"
                    >
                      {cancellingId === req.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      req.status === 'APPROVED'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : req.status === 'REJECTED'
                          ? 'bg-red-100 dark:bg-red-900/30 text-brand-error'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
