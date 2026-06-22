'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, Flame, Star, Trophy } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { SkeletonCard } from '../shared/SkeletonCard';
import { StreakBadge } from './StreakBadge';
import { TierPathVisualizer } from './TierPathVisualizer';

const TIER_DATA = [
  { tier: 1, name: 'Sprout', badgeIcon: 'Sprout', color: 'from-green-400 to-emerald-600', gradient: 'from-green-400 to-emerald-600', badgeShape: 'circle' },
  { tier: 2, name: 'Volunteer', badgeIcon: 'Users', color: 'from-blue-400 to-indigo-600', gradient: 'from-blue-400 to-indigo-600', badgeShape: 'hexagon' },
  { tier: 3, name: 'Contributor', badgeIcon: 'Wrench', color: 'from-purple-400 to-violet-600', gradient: 'from-purple-400 to-violet-600', badgeShape: 'shield' },
  { tier: 4, name: 'Champion', badgeIcon: 'Crown', color: 'from-amber-400 to-orange-600', gradient: 'from-amber-400 to-orange-600', badgeShape: 'star' },
];

interface LevelData {
  tier: number;
  points: number;
  pointsToNext: number;
  streak: number;
  hoursVolunteered: number;
  nextLevel: { name: string; pointsRequired: number } | null;
}

export function LevelProgressCard() {
  const { data, isLoading } = useQuery<{ data: LevelData }>({
    queryKey: ['my-level'],
    queryFn: () => api.get('/users/me/level').then((r) => r.data),
  });

  if (isLoading) return <SkeletonCard />;

  const level = data?.data;
  if (!level) return null;

  const currentTier = TIER_DATA[level.tier - 1] ?? TIER_DATA[0];
  const progressPct = level.pointsToNext > 0
    ? Math.min((level.points / level.pointsToNext) * 100, 100)
    : 100;
  const isMaxLevel = level.tier >= TIER_DATA.length;

  return (
    <Link href="/volunteer/levels" className="block group">
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden hover:shadow-md hover:border-brand-primary/30 transition-all duration-200">
        <div className="p-5 space-y-5">
          {/* Current level header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentTier.gradient} flex items-center justify-center text-white shadow-md`}
              >
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-brand-muted">Current Level</p>
                <p className="font-heading font-bold text-lg text-brand-text">{currentTier.name}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-brand-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Tier path */}
          <TierPathVisualizer
            levels={TIER_DATA}
            currentLevelId={String(level.tier)}
            size="sm"
          />

          {/* Progress to next level */}
          {!isMaxLevel && level.pointsToNext > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-muted">
                  <span className="font-semibold text-brand-text">{level.points}</span> / {level.pointsToNext} points
                </span>
                <span className="text-brand-muted">{Math.round(progressPct)}%</span>
              </div>
              <div className="h-2 bg-brand-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {level.nextLevel && (
                <p className="text-xs text-brand-muted">
                  Next: {level.nextLevel.name} ({level.nextLevel.pointsRequired} points)
                </p>
              )}
            </div>
          )}

          {isMaxLevel && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <Star className="w-4 h-4" />
              <span className="font-medium">Maximum level reached!</span>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-sm text-brand-muted">
              <Clock className="w-4 h-4" />
              <span>{level.hoursVolunteered}h</span>
            </div>
            <StreakBadge streak={level.streak} />
          </div>
        </div>
      </div>
    </Link>
  );
}
