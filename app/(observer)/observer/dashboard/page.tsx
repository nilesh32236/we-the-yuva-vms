// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { StatsCard } from '../../../../components/charts/StatsCard';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../lib/api';

export default function ObserverDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'observer'],
    queryFn: () => api.get('/stats/observer').then((r) => r.data),
    staleTime: 60_000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 to-gray-500 p-6 md:p-8">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -right-4 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{greeting}</p>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-white">
              {user?.name?.split(' ')[0]}!
            </h1>
            <span className="inline-block mt-2 text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full">
              Observer
            </span>
            <p className="text-white/80 text-sm mt-3 max-w-xs">
              Read-only view of platform metrics and activity.
            </p>
          </div>
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/30">
            <span className="font-heading font-bold text-xl text-white">
              {user?.name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) ?? '?'}
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label="Total Volunteers"
            value={stats?.totalVolunteers ?? 0}
            icon={Users}
            accent="text-slate-600 dark:text-slate-400"
            accentBg="bg-slate-50 dark:bg-slate-900/50"
          />
          <StatsCard
            label="Hours Served"
            value={`${stats?.hoursServed ?? 0}h`}
            icon={Clock}
            accent="text-gray-600 dark:text-gray-400"
            accentBg="bg-gray-50 dark:bg-gray-900/50"
          />
          <StatsCard
            label="Active Events"
            value={stats?.activeEvents ?? 0}
            icon={Activity}
            accent="text-zinc-600 dark:text-zinc-400"
            accentBg="bg-zinc-50 dark:bg-zinc-900/50"
          />
        </div>
      )}

      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <h2 className="font-heading font-semibold text-sm text-brand-text">Quick Access</h2>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Opportunities', href: '/observer/opportunities' },
            { label: 'Events', href: '/observer/events' },
            { label: 'Reports', href: '/observer/reports' },
            { label: 'Stories', href: '/observer/stories' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between p-4 rounded-xl border border-brand-border hover:bg-brand-bg transition-colors cursor-pointer group"
            >
              <p className="text-sm font-medium text-brand-text">{label}</p>
              <span className="text-brand-muted group-hover:text-brand-primary transition-colors">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
