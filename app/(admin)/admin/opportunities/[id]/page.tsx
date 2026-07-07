'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  MapPin,
  ShieldAlert,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { StatsCard } from '@/components/charts/StatsCard';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-brand-primary/10 text-brand-primary',
  CLOSED: 'bg-muted text-muted-foreground',
  DRAFT: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
};

const APP_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  APPROVED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  REJECTED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  WITHDRAWN: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
};

interface OpportunityDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: string;
  totalSlots: number;
  status: string;
  startDate: string;
  endDate: string;
  deadline: string | null;
  isRemote: boolean;
  skills: string[];
  createdBy: { name: string; email: string } | null;
  organization: { name: string; id: string } | null;
  location: { name: string } | null;
  _count: { applications: number; events: number };
  applicationStats: { status: string; _count: number }[];
}

export default function AdminOpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const {
    data: opp,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-opportunity-detail', id],
    queryFn: () => api.get(`/admin/opportunities/${id}`).then((r) => r.data as OpportunityDetail),
    enabled: !!id,
  });

  const closeMut = useMutation({
    mutationFn: () => api.delete(`/opportunities/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-opportunities'] });
      toast({ title: 'Opportunity closed' });
      router.push('/admin/opportunities');
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-48 bg-brand-bg rounded-lg" />
        <div className="h-40 bg-brand-surface rounded-2xl border border-brand-border" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <div key={i} className="h-24 bg-brand-surface rounded-2xl border border-brand-border" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-40" />
        <p className="font-medium text-brand-text mb-1">Failed to load opportunity</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary cursor-pointer transition-colors shadow-sm mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="text-center py-20">
        <Briefcase className="w-16 h-16 text-brand-muted mx-auto mb-4 opacity-20" />
        <p className="font-medium text-brand-text">Opportunity not found</p>
        <Link
          href="/admin/opportunities"
          className="text-brand-primary text-sm mt-2 inline-block hover:underline"
        >
          Back to opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/admin/opportunities"
        className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Opportunities
      </Link>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-7 h-7 text-purple-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading font-bold text-2xl text-brand-text">{opp.title}</h1>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_STYLES[opp.status] ?? ''}`}
              >
                {opp.status}
              </span>
            </div>
            {opp.organization && (
              <p className="flex items-center gap-1.5 text-sm text-brand-muted mt-1">
                <Building2 className="w-3.5 h-3.5" />
                {opp.organization.name}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-brand-muted">
              <span>{opp.category}</span>
              <span>{opp.type}</span>
              {opp.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {opp.location.name}
                </span>
              )}
              {opp.isRemote && <span>Remote</span>}
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {new Date(opp.startDate).toLocaleDateString('en-IN')} -{' '}
                {new Date(opp.endDate).toLocaleDateString('en-IN')}
              </span>
              {opp.deadline && (
                <span>
                  Deadline:{' '}
                  {new Date(opp.deadline).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
              <span>By: {opp.createdBy?.name ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Total Applications"
          value={opp._count?.applications ?? 0}
          icon={FileSpreadsheet}
          accent="text-pink-500"
          accentBg="bg-pink-50 dark:bg-pink-950"
        />
        <StatsCard
          label="Slots"
          value={opp.totalSlots}
          icon={Users}
          accent="text-purple-500"
          accentBg="bg-purple-50 dark:bg-purple-950"
        />
        <StatsCard
          label="Events"
          value={opp._count?.events ?? 0}
          icon={Target}
          accent="text-emerald-500"
          accentBg="bg-emerald-50 dark:bg-emerald-950"
        />
      </div>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <h2 className="font-heading font-bold text-lg text-brand-text mb-4">
          Application Breakdown
        </h2>
        {!opp.applicationStats?.length ? (
          <p className="text-sm text-brand-muted italic">No applications yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {opp.applicationStats.map((s: { status: string; _count: number }) => (
              <div key={s.status} className="border border-brand-border rounded-xl p-4 text-center">
                <p
                  className={`text-xs font-semibold uppercase tracking-wide mb-1 ${APP_STATUS_COLORS[s.status] ?? ''}`}
                >
                  {s.status}
                </p>
                <p className="font-heading font-bold text-2xl text-brand-text">{s._count}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {opp.description && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
          <h2 className="font-heading font-bold text-lg text-brand-text mb-3">Description</h2>
          <p className="text-sm text-brand-muted whitespace-pre-wrap">{opp.description}</p>
          {opp.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {opp.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-bg text-brand-muted border border-brand-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <h2 className="font-heading font-bold text-lg text-brand-text mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/opportunities/${id}/edit`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary transition-colors shadow-sm"
          >
            Edit Opportunity
          </Link>
          {opp.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => setShowCloseConfirm(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-brand-error text-brand-error text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Close Opportunity
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showCloseConfirm}
        title="Close Opportunity"
        message={`Close "${opp.title}"? This will remove it from the platform.`}
        confirmLabel="Close"
        loading={closeMut.isPending}
        onConfirm={() => closeMut.mutate()}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </div>
  );
}
