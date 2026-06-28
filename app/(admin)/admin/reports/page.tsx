// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, TrendingUp, Users } from 'lucide-react';
import { StatsCard } from '../../../../components/charts/StatsCard';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { api } from '../../../../lib/api';

export default function AdminReportsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'admin'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="font-heading font-bold text-xl text-brand-text">Platform Reports</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            accent="text-purple-600 dark:text-purple-300"
            accentBg="bg-purple-50 dark:bg-purple-900/20"
          />
          <StatsCard
            label="Active Volunteers"
            value={stats?.activeVolunteers ?? 0}
            icon={TrendingUp}
            accent="text-emerald-600 dark:text-emerald-300"
            accentBg="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <StatsCard
            label="Total Hours"
            value={`${stats?.totalHours ?? 0}h`}
            icon={Clock}
            accent="text-cyan-600 dark:text-cyan-300"
            accentBg="bg-cyan-50 dark:bg-cyan-900/20"
          />
        </div>
      )}

      <div className="bg-card rounded-2xl border border-brand-border p-6 text-center">
        <Activity className="w-8 h-8 text-brand-muted mx-auto mb-2" />
        <p className="text-sm text-brand-muted">
          Advanced reports with charts and CSV export coming soon
        </p>
      </div>
    </div>
  );
}
