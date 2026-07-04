'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Briefcase, Building2, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { StatsCard } from '../../../../components/charts/StatsCard';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../lib/api';

export default function OrganizationDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'organization'],
    queryFn: () => api.get('/stats/coordinator').then((r) => r.data),
    staleTime: 60_000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (!user?.organizationId) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 p-6 md:p-8">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -right-4 w-28 h-28 rounded-full bg-white/10" />
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium mb-1">{greeting}</p>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-white">
              {user?.name?.split(' ')?.[0]}!
            </h1>
            <span className="inline-block mt-2 text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full">
              Org Admin
            </span>
          </div>
        </div>

        <div className="bg-brand-surface rounded-2xl border border-brand-border p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-brand-primary" />
          </div>
          <h2 className="font-heading font-semibold text-xl text-brand-text mb-2">
            Register Your Organization
          </h2>
          <p className="text-brand-muted text-sm max-w-md mx-auto mb-6">
            Set up your organization profile to start creating opportunities, managing events, and
            tracking volunteer impact.
          </p>
          <Link
            href="/register-organization"
            className="inline-flex items-center gap-2 bg-brand-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-secondary transition-all"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 p-6 md:p-8">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -right-4 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{greeting}</p>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-white">
              {user?.name?.split(' ')?.[0]}!
            </h1>
            <span className="inline-block mt-2 text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full">
              Org Admin
            </span>
            <p className="text-white/80 text-sm mt-3 max-w-xs">
              Manage your organization, coordinators, and impact from here.
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
            accent="text-indigo-600 dark:text-indigo-400"
            accentBg="bg-indigo-50 dark:bg-indigo-950/30"
          />
          <StatsCard
            label="Events This Month"
            value={stats?.eventsThisMonth ?? 0}
            icon={Calendar}
            accent="text-blue-600 dark:text-blue-400"
            accentBg="bg-blue-50 dark:bg-blue-950/30"
          />
          <StatsCard
            label="Active Opportunities"
            value={stats?.opportunities ?? 0}
            icon={Briefcase}
            accent="text-sky-600 dark:text-sky-400"
            accentBg="bg-sky-50 dark:bg-sky-950/30"
          />
        </div>
      )}

      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <h2 className="font-heading font-semibold text-sm text-brand-text">Quick Actions</h2>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/organization/coordinators"
            className="flex items-center justify-between p-4 rounded-xl bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer group"
          >
            <p className="text-sm font-semibold">Manage Coordinators</p>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
          <Link
            href="/organization/opportunities"
            className="flex items-center justify-between p-4 rounded-xl border border-brand-border hover:bg-brand-bg transition-colors cursor-pointer group"
          >
            <p className="text-sm font-medium text-brand-text">Org Opportunities</p>
            <span className="text-brand-muted group-hover:text-brand-primary transition-colors">
              →
            </span>
          </Link>
          <Link
            href="/organization/events"
            className="flex items-center justify-between p-4 rounded-xl border border-brand-border hover:bg-brand-bg transition-colors cursor-pointer group"
          >
            <p className="text-sm font-medium text-brand-text">Org Events</p>
            <span className="text-brand-muted group-hover:text-brand-primary transition-colors">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
