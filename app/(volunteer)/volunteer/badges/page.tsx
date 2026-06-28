'use client';

import { useQuery } from '@tanstack/react-query';
import { BadgeCard } from '@/components/badges/BadgeCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api';

interface BadgeDefinition {
  name: string;
  title: string;
  description: string;
  imageUrl: string;
}

interface EarnedBadge {
  badgeName: string;
  earnedAt: string;
}

export default function VolunteerBadgesPage() {
  const { data: allBadges, isLoading: loadingBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/badges').then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: myBadges, isLoading: loadingMine } = useQuery({
    queryKey: ['badges', 'me'],
    queryFn: () => api.get('/badges/me').then((r) => r.data),
    staleTime: 60_000,
  });

  const isLoading = loadingBadges || loadingMine;

  const badgeDefinitions: BadgeDefinition[] = allBadges ?? [];
  const earnedMap: Record<string, string> = {};
  (myBadges ?? []).forEach((eb: EarnedBadge) => {
    earnedMap[eb.badgeName] = eb.earnedAt;
  });

  const badgeList = badgeDefinitions.map((badge) => ({
    ...badge,
    earned: badge.name in earnedMap,
    earnedAt: earnedMap[badge.name] ?? null,
  }));

  const earnedBadges = badgeList.filter((b) => b.earned);
  const lockedBadges = badgeList.filter((b) => !b.earned);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading font-bold text-xl text-brand-text">Achievement Badges</h1>
        <p className="text-brand-muted text-sm mt-1">
          Collect badges by completing milestones and contributing to the community.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : badgeList.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎖️</p>
          <h3 className="text-sm font-semibold text-brand-text">No badges available</h3>
          <p className="text-xs text-brand-muted mt-1">Check back later for new achievements.</p>
        </div>
      ) : (
        <>
          {/* Earned Badges Section */}
          {earnedBadges.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
                Earned ({earnedBadges.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {earnedBadges.map((badge) => (
                  <BadgeCard key={badge.name} {...badge} earned />
                ))}
              </div>
            </section>
          )}

          {/* Locked Badges Section */}
          {lockedBadges.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
                Locked ({lockedBadges.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {lockedBadges.map((badge) => (
                  <BadgeCard key={badge.name} {...badge} earned={false} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
