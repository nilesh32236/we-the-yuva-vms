'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Scope = 'global' | 'location';
type Timeframe = 'weekly' | 'monthly' | 'all_time';
type SortBy = 'points' | 'hours';

export default function VolunteerLeaderboardPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<Scope>('global');
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const [sortBy, setSortBy] = useState<SortBy>('points');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', scope, timeframe, sortBy],
    queryFn: () =>
      api
        .get('/leaderboard', { params: { scope, timeframe, sortBy } })
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const entries: Array<{
    userId: string;
    name: string;
    points: number;
    hours: number;
    level: { name: string; badgeIcon: string; color: string } | null;
    avatarUrl: string | null;
  }> = data?.entries ?? [];

  const currentUserEntry = data?.currentUser ?? null;

  const top10 = entries.slice(0, 10);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-xl text-brand-text">Leaderboard</h1>
        <p className="text-brand-muted text-sm mt-1">
          See how you rank among fellow volunteers.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Scope Tabs */}
        <div className="flex gap-1 bg-brand-surface rounded-xl p-1 border border-brand-border w-fit">
          <button
            type="button"
            onClick={() => setScope('global')}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
              scope === 'global'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-brand-muted hover:text-brand-text'
            )}
          >
            Global
          </button>
          <button
            type="button"
            onClick={() => setScope('location')}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
              scope === 'location'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-brand-muted hover:text-brand-text'
            )}
          >
            My Location
          </button>
        </div>

        {/* Timeframe + Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-brand-surface rounded-lg p-0.5 border border-brand-border">
            {(['weekly', 'monthly', 'all_time'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  timeframe === tf
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-brand-muted hover:text-brand-text'
                )}
              >
                {tf === 'weekly' ? 'Weekly' : tf === 'monthly' ? 'Monthly' : 'All Time'}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-brand-surface rounded-lg p-0.5 border border-brand-border">
            {(['points', 'hours'] as SortBy[]).map((sb) => (
              <button
                key={sb}
                type="button"
                onClick={() => setSortBy(sb)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  sortBy === sb
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-brand-muted hover:text-brand-text'
                )}
              >
                {sb === 'points' ? 'Points' : 'Hours'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-surface border border-brand-border">
              <Skeleton className="w-8 h-6 rounded" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-3 w-1/5 rounded" />
              </div>
              <Skeleton className="h-5 w-14 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-8">
          <h3 className="text-sm font-semibold text-destructive">Failed to load leaderboard</h3>
          <p className="text-xs text-brand-muted mt-1">Please try again later.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && top10.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🏆</p>
          <h3 className="text-sm font-semibold text-brand-text">No rankings yet</h3>
          <p className="text-xs text-brand-muted mt-1">
            Start volunteering to appear on the leaderboard!
          </p>
        </div>
      )}

      {/* Top 10 List */}
      {!isLoading && !isError && top10.length > 0 && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border divide-y divide-brand-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-border">
            <h2 className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
              Top 10 — {timeframe === 'weekly' ? 'This Week' : timeframe === 'monthly' ? 'This Month' : 'All Time'}
            </h2>
          </div>
          {top10.map((entry, idx) => (
            <LeaderboardRow
              key={entry.userId}
              rank={idx + 1}
              name={entry.name}
              points={entry.points}
              hours={entry.hours}
              level={entry.level}
              avatarUrl={entry.avatarUrl}
              sortBy={sortBy}
            />
          ))}
        </div>
      )}

      {/* Current User's Rank Pinned */}
      {!isLoading && !isError && currentUserEntry && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border/70 overflow-hidden">
          <div className="px-4 py-2 border-b border-brand-border/40 bg-brand-primary/5">
            <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
              Your Rank
            </span>
          </div>
          <LeaderboardRow
            rank={currentUserEntry.rank}
            name={currentUserEntry.name}
            points={currentUserEntry.points}
            hours={currentUserEntry.hours}
            level={currentUserEntry.level ?? null}
            avatarUrl={currentUserEntry.avatarUrl ?? null}
            isCurrentUser
            sortBy={sortBy}
          />
        </div>
      )}

      {/* Fallback when user has no rank */}
      {!isLoading && !isError && !currentUserEntry && (
        <div className="text-center py-6 bg-brand-surface rounded-2xl border border-brand-border">
          <p className="text-xs text-brand-muted">
            Participate in events to get ranked on the leaderboard.
          </p>
        </div>
      )}
    </div>
  );
}
