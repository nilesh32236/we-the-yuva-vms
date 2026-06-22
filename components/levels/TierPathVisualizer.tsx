'use client';

import { Crown, Sprout, Users, Wrench } from 'lucide-react';

interface TierInfo {
  tier: number;
  name: string;
  badgeIcon: string;
  color: string;
  gradient: string;
  badgeShape: string;
}

interface TierPathVisualizerProps {
  levels: TierInfo[];
  currentLevelId?: string | null;
  size?: 'sm' | 'md';
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sprout: () => <Sprout className="w-full h-full p-1.5" />,
  Users: () => <Users className="w-full h-full p-1.5" />,
  Wrench: () => <Wrench className="w-full h-full p-1.5" />,
  Crown: () => <Crown className="w-full h-full p-1.5" />,
};

const SHAPE_CLASSES: Record<string, string> = {
  circle: 'rounded-full',
  hexagon: 'rounded-xl rotate-45',
  shield: 'rounded-2xl',
  star: 'rounded-lg',
};

const INNER_CLASSES: Record<string, string> = {
  hexagon: '-rotate-45',
  star: '',
  circle: '',
  shield: '',
};

function calcCompletion(levels: TierInfo[], currentLevelId?: string | null): number {
  if (!currentLevelId) return 0;
  const idx = levels.findIndex((l) => l.tier.toString() === currentLevelId || l.name === currentLevelId);
  if (idx === -1) return 0;
  return Math.round((idx / (levels.length - 1)) * 100);
}

export function TierPathVisualizer({
  levels,
  currentLevelId,
  size = 'md',
}: TierPathVisualizerProps) {
  const badgePx = size === 'sm' ? 36 : 48;
  const completionPct = calcCompletion(levels, currentLevelId);

  return (
    <div className="w-full" role="navigation" aria-label="Tier progression path">
      <div className="relative flex items-center justify-between">
        {/* Connection line background */}
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-brand-border rounded-full" />

        {/* Connection line fill */}
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full transition-all duration-700"
          style={{ width: `${completionPct}%` }}
        />

        {levels.map((level, index) => {
          const isEarned = currentLevelId
            ? level.tier <= levels.find((l) => l.tier.toString() === currentLevelId || l.name === currentLevelId)?.tier!
            : false;
          const isCurrent =
            level.tier.toString() === currentLevelId ||
            level.name === currentLevelId;
          const Icon = ICON_MAP[level.badgeIcon] ?? ICON_MAP.Sprout;
          const shapeClass = SHAPE_CLASSES[level.badgeShape] ?? 'rounded-full';
          const innerClass = INNER_CLASSES[level.badgeShape] ?? '';

          const stateClass = isEarned
            ? `bg-gradient-to-br ${level.gradient} text-white shadow-md`
            : 'bg-brand-border text-brand-muted';
          const pulseClass = isCurrent ? 'animate-pulse ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-surface' : '';

          return (
            <div key={level.tier} className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={`${shapeClass} ${stateClass} ${pulseClass} flex items-center justify-center transition-all duration-300`}
                style={{ width: badgePx, height: badgePx }}
                role="img"
                aria-label={`${level.name}${isCurrent ? ' (current)' : ''}`}
              >
                <div className={innerClass}>
                  <Icon />
                </div>
              </div>
              {size === 'md' && (
                <span
                  className={`text-xs font-medium ${isEarned ? 'text-brand-text' : 'text-brand-muted'}`}
                >
                  {level.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
