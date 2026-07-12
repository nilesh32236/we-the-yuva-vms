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
        <div role="status" aria-busy="true" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
          <StatsCard
            label="Active Volunteers"
            value={stats?.activeVolunteers ?? 0}
            icon={TrendingUp}
          />
          <StatsCard label="Total Hours" value={`${stats?.totalHours ?? 0}h`} icon={Clock} />
        </div>
      )}

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 text-center">
        <Activity className="w-8 h-8 text-brand-muted mx-auto mb-2" />
        <p className="text-sm text-brand-muted">
          Advanced reports with charts and CSV export coming soon
        </p>
      </div>
    </div>
  );
}
