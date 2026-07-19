'use client';

import Image from 'next/image';
import {
  Award,
  Check,
  Lock,
  Star,
  Shield,
  Zap,
  Target,
  Heart,
  BookOpen,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface BadgeCardProps {
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  earned: boolean;
  earnedAt?: string | null;
}

const BADGE_ICONS: Record<string, typeof Award> = {
  FIRST_STEPS: BookOpen,
  EVENT_SEEKER: Target,
  CENTURY_CLUB: Award,
  COMMUNITY_BUILDER: Users,
  PROBLEM_SOLVER: Zap,
  MENTOR: Heart,
  FAST_RISER: Star,
  STREAK_MASTER: Shield,
  STORYTELLER: BookOpen,
  NIGHT_OWL: Star,
};

export function BadgeCard({
  name,
  title,
  description,
  imageUrl,
  earned,
  earnedAt,
}: BadgeCardProps) {
  const IconComponent = imageUrl ? null : (BADGE_ICONS[name] ?? Award);

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-5 flex flex-col items-center text-center gap-3 transition-shadow',
        earned
          ? 'bg-brand-surface border-brand-border shadow-sm'
          : 'bg-brand-surface/50 border-brand-border/30 opacity-60'
      )}
    >
      {/* Overlay icon */}
      <div
        className={cn(
          'absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center',
          earned ? 'bg-emerald-500 text-white' : 'bg-brand-border text-brand-muted'
        )}
      >
        {earned ? (
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        ) : (
          <Lock className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Badge Image */}
      <div
        className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0',
          earned ? 'bg-gradient-to-br from-amber-300 to-amber-500' : 'bg-brand-border'
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={48}
            height={48}
            loading="lazy"
            className="w-12 h-12 object-contain"
          />
        ) : (
          <IconComponent
            className={cn('w-8 h-8', earned ? 'text-white' : 'text-brand-muted')}
          />
        )}
      </div>

      {/* Title */}
      <div>
        <h3
          className={cn('text-sm font-semibold', earned ? 'text-brand-text' : 'text-brand-muted')}
        >
          {title}
        </h3>
        <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{description}</p>
      </div>

      {/* Earned Date */}
      {earned && earnedAt && (
        <span className="text-[10px] text-brand-muted/70 mt-auto">
          Earned {(() => {
            try {
              return new Date(earnedAt!).toLocaleDateString();
            } catch {
              return 'Unknown date';
            }
          })()}
        </span>
      )}
      {!earned && <span className="text-[10px] text-brand-muted/40 mt-auto">Not yet earned</span>}
    </div>
  );
}
