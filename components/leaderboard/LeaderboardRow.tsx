'use client';

import Image from 'next/image';
import { cn } from '../../lib/utils';
import { LevelBadge } from '../levels/LevelBadge';

interface LeaderboardRowProps {
  rank: number;
  name: string;
  points: number;
  hours: number;
  level?: { name: string; badgeIcon: string; color: string } | null;
  avatarUrl?: string | null;
  isCurrentUser?: boolean;
  sortBy?: 'points' | 'hours';
}

const MEDALS = ['', '🥇', '🥈', '🥉'];

export function LeaderboardRow({
  rank,
  name,
  points,
  hours,
  level,
  avatarUrl,
  isCurrentUser,
  sortBy = 'points',
}: LeaderboardRowProps) {
  const isTop3 = rank >= 1 && rank <= 3;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
        isCurrentUser && 'bg-brand-primary/10 border border-brand-primary/20',
        !isCurrentUser && 'hover:bg-brand-bg'
      )}
    >
      {/* Rank */}
      <div className="w-8 flex-shrink-0 text-center">
        {isTop3 ? (
          <span className="text-lg" role="img" aria-label={`Rank ${rank}`}>
            {MEDALS[rank]}
          </span>
        ) : (
          <span className="text-sm font-semibold text-brand-muted">{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-brand-border flex items-center justify-center flex-shrink-0 overflow-hidden">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold text-brand-muted">
            {name
              ?.split(' ')
              ?.map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) ?? '?'}
          </span>
        )}
      </div>

      {/* Name + Level */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold truncate',
            isCurrentUser ? 'text-brand-primary' : 'text-brand-text'
          )}
        >
          {name}
          {isCurrentUser && (
            <span className="ml-1.5 text-[10px] font-medium text-brand-primary/70">(You)</span>
          )}
        </p>
        {level && (
          <div className="flex items-center gap-1 mt-0.5">
            <LevelBadge
              tier={0}
              name={level.name}
              badgeIcon={level.badgeIcon}
              color={level.color}
              size="sm"
            />
            <span className="text-[11px] text-brand-muted">{level.name}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-bold text-brand-text">
          {sortBy === 'points' ? points : hours}
          <span className="text-xs font-normal text-brand-muted ml-0.5">
            {sortBy === 'points' ? 'pts' : 'hrs'}
          </span>
        </p>
      </div>
    </div>
  );
}
