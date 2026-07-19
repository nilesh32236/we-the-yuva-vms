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
  const classes = SIZE_CLASSES[size] ?? SIZE_CLASSES.sm;

  return (
    <div
      className={`inline-flex items-center ${classes.container} rounded-full bg-amber-100 dark:bg-amber-900/30`}
      role="status"
      aria-label={`${streak} day streak`}
    >
      <Flame className={`${classes.icon} text-amber-500 dark:text-amber-400`} />
      <span className={`${classes.text} font-semibold text-amber-700 dark:text-amber-400`}>
        {streak}
      </span>
    </div>
  );
}
