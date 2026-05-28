'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { StatsCard } from '../../../../components/charts/StatsCard';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../hooks/useAuth';

export default function VolunteerDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'volunteer'],
    queryFn: () => api.get('/stats/volunteer').then((r) => r.data),
    staleTime: 60_000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-6 md:p-8">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -right-4 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{greeting}</p>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-white">
              {user?.name?.split(' ')[0]}!
            </h1>
            <span className="inline-block mt-2 text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full">
              Volunteer
            </span>
            <p className="text-white/80 text-sm mt-3 max-w-xs">
              Welcome to WeTheYuva VMS. Here&apos;s your overview for today.
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

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label="Total Hours"
            value={`${stats?.totalHours ?? 0}h`}
            icon={Clock}
            accent="text-emerald-600"
            accentBg="bg-emerald-50"
          />
          <StatsCard
            label="Events Attended"
            value={stats?.eventsAttended ?? 0}
            icon={Calendar}
            accent="text-teal-600"
            accentBg="bg-teal-50"
          />
          <StatsCard
            label="Applications"
            value={stats?.applications ?? 0}
            icon={Activity}
            accent="text-green-600"
            accentBg="bg-green-50"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <h2 className="font-heading font-semibold text-sm text-brand-text">Quick Actions</h2>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/volunteer/opportunities"
            className="flex items-center justify-between p-4 rounded-xl bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer group"
          >
            <p className="text-sm font-semibold">Browse Opportunities</p>
            <span className="text-white/80 group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
          <Link
            href="/volunteer/events"
            className="flex items-center justify-between p-4 rounded-xl border border-brand-border hover:bg-brand-bg transition-colors cursor-pointer group"
          >
            <p className="text-sm font-medium text-brand-text">My Events</p>
            <span className="text-brand-muted group-hover:text-brand-primary transition-colors">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
