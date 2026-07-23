'use client';

import { Crown, Sprout, Users, Wrench } from 'lucide-react';

interface LevelBadgeProps {
  tier?: number;
  name: string;
  badgeIcon: string;
  color: string;
  badgeShape?: 'circle' | 'hexagon' | 'shield' | 'star';
  size?: 'sm' | 'md' | 'lg';
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sprout: () => <Sprout className="w-full h-full p-1.5" />,
  Users: () => <Users className="w-full h-full p-1.5" />,
  Wrench: () => <Wrench className="w-full h-full p-1.5" />,
  Crown: () => <Crown className="w-full h-full p-1.5" />,
};

const SIZE_MAP: Record<string, number> = {
  sm: 40,
  md: 56,
  lg: 72,
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

export function LevelBadge({
  tier,
  name,
  badgeIcon,
  color,
  badgeShape = 'circle',
  size = 'md',
}: LevelBadgeProps) {
  const px = SIZE_MAP[size];
  const Icon = ICON_MAP[badgeIcon] ?? ICON_MAP.Sprout;
  const shapeClass = SHAPE_CLASSES[badgeShape];
  const innerClass = INNER_CLASSES[badgeShape];

  return (
    <div
      className="flex flex-col items-center gap-1"
      role="img"
      aria-label={tier != null ? `${name} level ${tier}` : name}
    >
      <div
        className={`${shapeClass} flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${color}`}
        style={{ width: px, height: px }}
      >
        <div className={innerClass}>
          <Icon />
        </div>
      </div>
      {size === 'lg' && <span className="text-xs font-medium text-brand-muted">{name}</span>}
    </div>
  );
}
