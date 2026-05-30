'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatsCard } from '../../../../components/charts/StatsCard';

const CategoryPieChart = dynamic(
  () =>
    import('../../../../components/charts/CategoryPieChart').then((mod) => mod.CategoryPieChart),
  { ssr: false }
);
const HoursBarChart = dynamic(
  () => import('../../../../components/charts/HoursBarChart').then((mod) => mod.HoursBarChart),
  { ssr: false }
);

import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { api } from '../../../../lib/api';

export default function ObserverReportsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'observer'],
    queryFn: () => api.get('/stats/observer').then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="font-heading font-bold text-xl text-brand-text">Reports</h1>

      {/* Summary stats */}
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
            accent="text-slate-600"
            accentBg="bg-slate-50"
          />
          <StatsCard
            label="Hours Served"
            value={`${stats?.hoursServed ?? 0}h`}
            icon={Clock}
            accent="text-gray-600"
            accentBg="bg-gray-50"
          />
          <StatsCard
            label="Active Events"
            value={stats?.activeEvents ?? 0}
            icon={Activity}
            accent="text-zinc-600"
            accentBg="bg-zinc-50"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-brand-border p-5">
          <h2 className="font-heading font-semibold text-sm text-brand-text mb-4">
            Opportunities by Category
          </h2>
          <CategoryPieChart data={stats?.byCategory ?? []} />
        </div>
        <div className="bg-white rounded-2xl border border-brand-border p-5">
          <h2 className="font-heading font-semibold text-sm text-brand-text mb-4">
            Hours Served by Month
          </h2>
          <HoursBarChart data={stats?.hoursByMonth ?? []} />
        </div>
      </div>
    </div>
  );
}
