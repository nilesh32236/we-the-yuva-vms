'use client';

import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md';
}

const SIZE_CLASSES: Record<string, { container: string; icon: string; text: string }> = {
  sm: { container: 'px-2 py-0.5 gap-1', icon: 'w-3 h-3', text: 'text-xs' },
  md: { container: 'px-3 py-1 gap-1.5', icon: 'w-4 h-4', text: 'text-sm' },
};

export function StreakBadge({ streak, size = 'sm' }: StreakBadgeProps) {
  const classes = SIZE_CLASSES[size];

  return (
    <div
      className={`inline-flex items-center ${classes.container} rounded-full bg-orange-100 dark:bg-orange-900/30`}
      role="status"
      aria-label={`${streak} day streak`}
    >
      <Flame className={`${classes.icon} text-orange-500 dark:text-orange-400`} />
      <span className={`${classes.text} font-semibold text-orange-700 dark:text-orange-400`}>
        {streak}
      </span>
    </div>
  );
}
