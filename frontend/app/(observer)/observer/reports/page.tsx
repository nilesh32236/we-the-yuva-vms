// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatsCard } from '@/components/charts/StatsCard';

const CategoryPieChart = dynamic(
  () => import('@/components/charts/CategoryPieChart').then((mod) => mod.CategoryPieChart),
  { ssr: false }
);
const HoursBarChart = dynamic(
  () => import('@/components/charts/HoursBarChart').then((mod) => mod.HoursBarChart),
  { ssr: false }
);

import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function ObserverReportsPage() {
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['stats', 'observer'],
    queryFn: () => api.get('/stats/observer', { headers: { 'Cache-Control': 'no-store' } }).then((r) => r.data),
    staleTime: 0,
    gcTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="font-heading font-bold text-xl text-brand-text">Reports</h1>

      {/* Summary stats */}
      {isError ? (
        <div className="bg-brand-error/10 border border-brand-error/30 rounded-lg p-4 text-center">
          <p className="text-sm text-brand-error">Failed to load reports. Please try again.</p>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2 underline">
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard label="Total Volunteers" value={stats?.totalVolunteers ?? 0} icon={Users} />
          <StatsCard label="Hours Served" value={`${stats?.hoursServed ?? 0}h`} icon={Clock} />
          <StatsCard label="Active Events" value={stats?.activeEvents ?? 0} icon={Activity} />
        </div>
      )}

      {/* Charts — only render when API provides data */}
      {stats?.byCategory && stats.byCategory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 card-hover">
            <h2 className="font-heading font-semibold text-sm text-brand-text mb-4">
              Opportunities by Category
            </h2>
            <CategoryPieChart data={stats.byCategory} />
          </div>
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 card-hover">
            <h2 className="font-heading font-semibold text-sm text-brand-text mb-4">
              Hours Served by Month
            </h2>
            <HoursBarChart data={stats?.hoursByMonth ?? []} />
          </div>
        </div>
      )}
    </div>
  );
}
