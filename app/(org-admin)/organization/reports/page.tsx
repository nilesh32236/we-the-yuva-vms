'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Briefcase, Calendar, Users } from 'lucide-react';
import { StatsCard } from '@/components/charts/StatsCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api';

export default function OrgAdminReportsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'org-admin'],
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
          <StatsCard label="Active Volunteers" value={stats?.activeVolunteers ?? 0} icon={Users} accent="text-cyan-600" accentBg="bg-cyan-50" />
          <StatsCard label="Events This Month" value={stats?.eventsThisMonth ?? 0} icon={Calendar} accent="text-sky-600" accentBg="bg-sky-50" />
          <StatsCard label="Active Opportunities" value={stats?.opportunities ?? 0} icon={Briefcase} accent="text-blue-600" accentBg="bg-blue-50" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-brand-border p-6 text-center">
        <Activity className="w-8 h-8 text-brand-muted mx-auto mb-2" />
        <p className="text-sm text-brand-muted">
          Detailed reports with charts and CSV export coming soon
        </p>
      </div>
    </div>
  );
}
