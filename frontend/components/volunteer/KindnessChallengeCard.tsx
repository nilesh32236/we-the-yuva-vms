'use client';

import Link from 'next/link';
import { Sprout } from 'lucide-react';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useMyChallenge } from '@/lib/kindness';

export function KindnessChallengeCard() {
  const { data, isLoading } = useMyChallenge();
  if (isLoading) return <SkeletonCard />;

  if (!data) {
    return (
      <Link href="/volunteer/kindness-challenge" className="block rounded-2xl border border-brand-border bg-brand-surface p-4 hover:card-hover transition-shadow">
        <div className="flex items-center gap-3">
          <Sprout className="w-8 h-8 text-brand-primary" />
          <div>
            <p className="font-medium text-brand-text">Take the 7-Day Kindness Challenge</p>
            <p className="text-xs text-brand-muted">Small acts, real impact — start today</p>
          </div>
        </div>
      </Link>
    );
  }

  const { challenge, view } = data;
  const label =
    challenge.status === 'COMPLETED'
      ? 'Completed — thanks for sharing your story!'
      : view.canShareStory
        ? 'Share your story to unlock Part II →'
        : `Day ${view.currentDay} of 7 · ${view.checkedInDays.length}/7 check-ins`;

  return (
    <Link href="/volunteer/kindness-challenge" className="block rounded-2xl border border-brand-border bg-brand-surface p-4 hover:card-hover transition-shadow">
      <div className="flex items-center gap-3">
        <Sprout className="w-8 h-8 text-brand-primary shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-brand-text truncate">Kindness Challenge</p>
          <p className="text-xs text-brand-muted">{label}</p>
        </div>
      </div>
    </Link>
  );
}
