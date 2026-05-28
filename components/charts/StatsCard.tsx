'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  accentBg?: string;
  trend?: { value: number; label: string };
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  accent = 'text-brand-primary',
  accentBg = 'bg-brand-bg',
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border p-5 flex items-center gap-4 hover:shadow-md hover:border-brand-primary/30 transition-all duration-200">
      <div
        className={`w-12 h-12 rounded-xl ${accentBg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={`w-6 h-6 ${accent}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading font-bold text-2xl text-brand-text leading-none">{value}</p>
        <p className="text-brand-muted text-xs mt-1 truncate">{label}</p>
        {trend && (
          <div
            className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {trend.value >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
