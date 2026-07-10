'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, Building2, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { StatsCard } from '../../../../components/charts/StatsCard';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../lib/api';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'admin'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
    staleTime: 60_000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      }
    >
      <div className="space-y-6 max-w-5xl">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-6 md:p-8">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -right-4 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">{greeting}</p>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-white">
                {user?.name?.split(' ')?.[0]}!
              </h1>
              <span className="inline-block mt-2 text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full">
                Admin
              </span>
              <p className="text-white/80 text-sm mt-3 max-w-xs">
                Full system overview and management.
              </p>
            </div>
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/30">
              <span className="font-heading font-bold text-xl text-white">
                {user?.name
                  ?.split(' ')
                  ?.map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) ?? '?'}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
            <StatsCard
              label="Active Volunteers"
              value={stats?.activeVolunteers ?? 0}
              icon={Activity}
            />
            <StatsCard
              label="Total Hours Served"
              value={`${stats?.totalHours ?? 0}h`}
              icon={Clock}
            />
            <StatsCard
              label="Organizations"
              value={`${stats?.activeOrgs ?? 0} active`}
              icon={Building2}
            />
          </div>
        )}

        <div className="bg-brand-surface card-hover rounded-2xl border border-brand-border overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border">
            <h2 className="font-heading font-semibold text-sm text-brand-text">Quick Actions</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-4 rounded-xl bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer group"
            >
              <p className="text-sm font-semibold">Manage Users</p>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/admin/opportunities"
              className="flex items-center justify-between p-4 rounded-xl border border-brand-border hover:bg-brand-bg transition-colors cursor-pointer group"
            >
              <p className="text-sm font-medium text-brand-text">Opportunities</p>
              <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-colors" />
            </Link>
            <Link
              href="/admin/events"
              className="flex items-center justify-between p-4 rounded-xl border border-brand-border hover:bg-brand-bg transition-colors cursor-pointer group"
            >
              <p className="text-sm font-medium text-brand-text">Events</p>
              <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-colors" />
            </Link>
            <Link
              href="/admin/organizations"
              className="flex items-center justify-between p-4 rounded-xl border border-brand-border hover:bg-brand-bg transition-colors cursor-pointer group"
            >
              <p className="text-sm font-medium text-brand-text">Organizations</p>
              <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
