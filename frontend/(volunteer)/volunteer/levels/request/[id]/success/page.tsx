'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CelebrationOverlay } from '@/components/levels/CelebrationOverlay';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';

const TIER_DATA = [
  {
    tier: 1,
    name: 'Onboarded',
    badgeIcon: 'Sprout',
    color: 'from-green-400 to-emerald-600',
    gradient: 'from-green-400 to-emerald-600',
    badgeShape: 'circle',
  },
  {
    tier: 2,
    name: 'Mobilizer',
    badgeIcon: 'Users',
    color: 'from-blue-400 to-indigo-600',
    gradient: 'from-blue-400 to-indigo-600',
    badgeShape: 'hexagon',
  },
  {
    tier: 3,
    name: 'Problem Solver',
    badgeIcon: 'Wrench',
    color: 'from-purple-400 to-violet-600',
    gradient: 'from-purple-400 to-violet-600',
    badgeShape: 'shield',
  },
  {
    tier: 4,
    name: 'Leadership',
    badgeIcon: 'Crown',
    color: 'from-amber-400 to-orange-600',
    gradient: 'from-amber-400 to-orange-600',
    badgeShape: 'star',
  },
];

interface RequestDetail {
  id: string;
  requestedLevel: string;
  tier: number;
  points: number;
  status: string;
}

export default function LevelRequestSuccessPage() {
  const params = useParams<{ id: string }>();
  const requestId = params?.id;

  const { data: detailRes, isLoading } = useQuery<{ data: RequestDetail }>({
    queryKey: ['level-request', requestId],
    queryFn: () =>
      api.get(`/levels/users/me/level/requests`).then((r) => {
        const found = r.data?.data?.find((req: RequestDetail) => req.id === requestId);
        return { data: found };
      }),
    enabled: !!requestId,
  });

  const detail = detailRes?.data;
  const tierInfo = TIER_DATA[(detail?.tier ?? 1) - 1] ?? TIER_DATA[0];

  async function handleShare() {
    haptic.light();
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: 'Level Up!',
        text: `I just requested a level-up to ${detail?.requestedLevel ?? 'next level'} on WeTheYuva!`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <CelebrationOverlay
        levelName={detail?.requestedLevel ?? tierInfo.name}
        tier={detail?.tier ?? 1}
        points={detail?.points ?? 0}
      />

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-8 text-center relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <h1 className="font-heading font-bold text-2xl text-brand-text">Request Submitted!</h1>
          <p className="text-brand-muted text-sm max-w-sm mx-auto">
            Your level-up request for{' '}
            <span className="font-semibold text-brand-text">
              {detail?.requestedLevel ?? tierInfo.name}
            </span>{' '}
            has been sent for review. You&apos;ll be notified once it&apos;s approved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/volunteer/levels" onClick={() => haptic.light()}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4" /> Back to Levels
              </Button>
            </Link>
            <Button variant="primary" onClick={handleShare}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
