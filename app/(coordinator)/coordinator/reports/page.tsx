// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, CalendarDays, Clock, Users } from 'lucide-react';
import { StatsCard } from '../../../../components/charts/StatsCard';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { api } from '../../../../lib/api';

export default function CoordinatorReportsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'coordinator'],
    queryFn: () => api.get('/stats/coordinator').then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="font-heading font-bold text-xl text-brand-text">Reports</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label="Active Volunteers"
            value={stats?.activeVolunteers ?? 0}
            icon={Users}
          />
          <StatsCard
            label="Events This Month"
            value={stats?.eventsThisMonth ?? 0}
            icon={CalendarDays}
          />
          <StatsCard
            label="Active Opportunities"
            value={stats?.activeOpportunities ?? 0}
            icon={Activity}
          />
        </div>
      )}

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 text-center">
        <Clock className="w-8 h-8 text-brand-muted mx-auto mb-2" />
        <p className="text-sm text-brand-muted">Detailed reports with charts coming soon</p>
      </div>
    </div>
  );
}
