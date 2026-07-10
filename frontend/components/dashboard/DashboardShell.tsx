'use client';

import {
  Activity,
  ArrowRight,
  BarChart,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Lock,
  Search,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { SkeletonCard } from '../shared/SkeletonCard';

const ICONS = {
  Clock,
  Calendar,
  CheckCircle,
  Users,
  Activity,
  Briefcase,
  TrendingUp,
  BarChart,
  BookOpen,
  Search,
  Settings,
} as const;

export type IconName = keyof typeof ICONS;

interface StatCard {
  label: string;
  value: string;
  icon: IconName;
  /** Optional accent color class e.g. "text-emerald-600" */
  accent?: string;
  /** Optional bg color class e.g. "bg-emerald-50" */
  accentBg?: string;
}

interface QuickAction {
  label: string;
  href: string;
  icon: IconName;
  disabled?: boolean;
}

interface DashboardShellProps {
  stats: StatCard[];
  /** Primary CTA — kept for backward compat */
  ctaLabel: string;
  ctaHref: string;
  ctaDisabled?: boolean;
  /** Optional secondary quick actions */
  quickActions?: QuickAction[];
  /** Role-specific hero gradient classes */
  heroGradient?: string;
  /** Role label shown in hero */
  roleLabel?: string;
}

function HeroBanner({
  user,
  heroGradient,
  roleLabel,
  isLoading,
}: {
  user: { name?: string } | null;
  heroGradient: string;
  roleLabel?: string;
  isLoading: boolean;
}) {
  if (isLoading) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${heroGradient} p-6 md:p-8`}
    >
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -right-4 w-28 h-28 rounded-full bg-white/10" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-white/70 text-sm font-medium mb-1">{greeting}</p>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-white leading-tight">
            {firstName}!
          </h1>
          {roleLabel && (
            <span className="inline-block mt-2 text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full">
              {roleLabel}
            </span>
          )}
          <p className="text-white/80 text-sm mt-3 max-w-xs">
            Welcome to WeTheYuva VMS. Here&apos;s your overview for today.
          </p>
        </div>

        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/30">
          <span className="font-heading font-bold text-xl text-white">
            {user?.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) ?? '?'}
          </span>
        </div>
      </div>
    </div>
  );
}

function QuickActionsPanel({
  ctaLabel,
  ctaHref,
  ctaDisabled,
  quickActions,
}: {
  ctaLabel: string;
  ctaHref: string;
  ctaDisabled?: boolean;
  quickActions?: QuickAction[];
}) {
  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-border">
        <h2 className="font-heading font-semibold text-sm text-brand-text">Quick Actions</h2>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ctaDisabled ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-brand-bg border border-brand-border opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-border flex items-center justify-center">
                <Lock className="w-4 h-4 text-brand-muted" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text">{ctaLabel}</p>
                <p className="text-xs text-brand-muted">Coming in Phase 2</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-muted flex-shrink-0" aria-hidden="true" />
          </div>
        ) : (
          <Link
            href={ctaHref}
            className="flex items-center justify-between p-4 rounded-xl bg-brand-primary text-white
              hover:bg-brand-secondary transition-colors duration-200 cursor-pointer group active-bounce"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold">{ctaLabel}</p>
            </div>
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </Link>
        )}

        {quickActions?.map((action) => {
          const Icon = ICONS[action.icon];
          if (action.disabled) {
            return (
              <div
                key={action.label}
                className="flex items-center justify-between p-4 rounded-xl bg-brand-bg border border-brand-border opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-border flex items-center justify-center">
                    <Lock className="w-4 h-4 text-brand-muted" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text">{action.label}</p>
                    <p className="text-xs text-brand-muted">Coming in Phase 2</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-muted flex-shrink-0" aria-hidden="true" />
              </div>
            );
          }
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center justify-between p-4 rounded-xl border border-brand-border
                hover:bg-brand-bg hover:border-brand-primary/40 transition-colors duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-bg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-brand-text">{action.label}</p>
              </div>
              <ArrowRight
                className="w-4 h-4 text-brand-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-colors"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardShell({
  stats,
  ctaLabel,
  ctaHref,
  ctaDisabled,
  quickActions,
  heroGradient = 'from-brand-primary to-brand-secondary',
  roleLabel,
}: DashboardShellProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-5xl">
        <SkeletonCard />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <HeroBanner
        user={user}
        heroGradient={heroGradient}
        roleLabel={roleLabel}
        isLoading={isLoading}
      />

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = ICONS[stat.icon];
          const accent = stat.accent ?? 'text-brand-primary';
          const accentBg = stat.accentBg ?? 'bg-brand-bg';
          return (
            <div
              key={stat.label}
              className="bg-brand-surface rounded-2xl border border-brand-border p-5 flex items-center gap-4 card-hover cursor-default"
            >
              <div
                className={`w-12 h-12 rounded-xl ${accentBg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-6 h-6 ${accent}`} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-2xl text-brand-text leading-none">
                  {stat.value}
                </p>
                <p className="text-brand-muted text-xs mt-1 truncate">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <QuickActionsPanel
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
        ctaDisabled={ctaDisabled}
        quickActions={quickActions}
      />
    </div>
  );
}
