'use client';

import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { Button } from '../../../../components/ui/Button';
import { useMyChallenge } from '../../../../lib/kindness';

export default function Part2Page() {
  const { data, isLoading } = useMyChallenge();
  if (isLoading) return <SkeletonCard />;
  const unlocked = !!data?.challenge.part2UnlockedAt;

  return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-5">
      {unlocked ? (
        <>
          <Sparkles className="w-16 h-16 text-brand-accent mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-brand-text">Part II unlocked</h1>
          <p className="text-brand-muted">The next stage of your volunteering journey is coming soon. We'll notify you here.</p>
        </>
      ) : (
        <>
          <Lock className="w-16 h-16 text-brand-muted mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-brand-text">Part II is locked</h1>
          <p className="text-brand-muted text-sm">
            Complete the 7-Day Kindness Challenge and share your story to unlock Part II of your volunteering journey.
          </p>
          <Link href="/volunteer/kindness-challenge"><Button variant="cta">Go to the Challenge</Button></Link>
        </>
      )}
    </div>
  );
}
