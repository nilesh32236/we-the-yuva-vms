'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, BookOpen, Calendar, Clock, MessageSquareText, TrendingUp } from 'lucide-react';
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
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../lib/api';

export default function VolunteerImpactPage() {
  const { user: _user } = useAuth();
  const { data: impact, isLoading } = useQuery({
    queryKey: ['stats', 'volunteer', 'impact'],
    queryFn: () => api.get('/stats/volunteer/impact').then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading font-bold text-xl text-brand-text">My Impact</h1>
        <p className="text-brand-muted text-sm mt-1">
          Track your volunteer journey and see the difference you&apos;ve made.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Hours"
            value={`${impact?.totalHours ?? 0}h`}
            icon={Clock}
            accent="text-brand-primary"
            accentBg="bg-brand-primary/10"
          />
          <StatsCard
            label="Events Attended"
            value={impact?.eventsAttended ?? 0}
            icon={Calendar}
            accent="text-brand-cta"
            accentBg="bg-brand-cta/10"
          />
          <StatsCard
            label="Stories Shared"
            value={impact?.storiesCount ?? 0}
            icon={BookOpen}
            accent="text-violet-600 dark:text-violet-400"
            accentBg="bg-violet-100 dark:bg-violet-900/30"
          />
          <StatsCard
            label="Feedback Given"
            value={impact?.feedbackCount ?? 0}
            icon={MessageSquareText}
            accent="text-blue-600 dark:text-blue-400"
            accentBg="bg-blue-100 dark:bg-blue-900/30"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-brand-primary" />
            <h2 className="font-heading font-semibold text-sm text-brand-text">Monthly Hours</h2>
          </div>
          {isLoading ? <SkeletonCard /> : <HoursBarChart data={impact?.monthlyHours ?? []} />}
        </div>

        <div className="bg-brand-surface rounded-2xl border border-brand-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-brand-cta" />
            <h2 className="font-heading font-semibold text-sm text-brand-text">
              Hours by Category
            </h2>
          </div>
          {isLoading ? <SkeletonCard /> : <CategoryPieChart data={impact?.categoryEvents ?? []} />}
        </div>
      </div>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-primary" />
          <h2 className="font-heading font-semibold text-sm text-brand-text">
            Category Breakdown (Hours)
          </h2>
        </div>
        {isLoading ? (
          <SkeletonCard />
        ) : !impact?.categoryHours?.length ? (
          <p className="text-center text-brand-muted text-sm py-8">No data available</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {impact.categoryHours.map((cat: { category: string; hours: number }) => (
              <div
                key={cat.category}
                className="p-3 rounded-xl bg-brand-bg border border-brand-border"
              >
                <p className="text-xs text-brand-muted capitalize">{cat.category.toLowerCase()}</p>
                <p className="font-heading font-bold text-lg text-brand-text">{cat.hours}h</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
