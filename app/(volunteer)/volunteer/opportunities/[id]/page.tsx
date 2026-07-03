'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Calendar, Clock, MapPin, MessageCircle, Tag, Users, Wifi } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { SkeletonCard } from '../../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';
import { haptic } from '@/lib/haptic';

const CATEGORY_COLORS: Record<string, string> = {
  EDUCATION: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  HEALTH: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  ENVIRONMENT: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  COMMUNITY: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  ARTS: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  SPORTS: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  TECHNOLOGY: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  ACTIVE_CITIZENSHIP: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  OTHER: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
};

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: opp, isLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => api.get(`/opportunities/${id}`).then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: myApplications } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () =>
      api
        .get('/opportunities/my-applications')
        .then((r) => r.data)
        .catch(() => []),
    staleTime: 60_000,
  });

  const myApp = (Array.isArray(myApplications) ? myApplications : myApplications?.data ?? []).find(
    (a: { opportunityId: string; status: string }) => a.opportunityId === id
  );

interface ApplicationInfo {
  id: string;
  opportunityId: string;
  status: string;
}

interface OpportunityInfo {
  _count?: { applications: number };
  [key: string]: unknown;
}

  const apply = useMutation({
    mutationFn: () => api.post(`/opportunities/${id}/apply`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['my-applications'] });
      await qc.cancelQueries({ queryKey: ['opportunity', id] });

      const previousMyApplications = qc.getQueryData<ApplicationInfo[]>(['my-applications']);
      const previousOpportunity = qc.getQueryData<OpportunityInfo>(['opportunity', id]);

      qc.setQueryData<ApplicationInfo[]>(['my-applications'], (old = []) => [
        ...old,
        { id: 'optimistic', opportunityId: id, status: 'PENDING' },
      ]);

      if (previousOpportunity) {
        qc.setQueryData<OpportunityInfo>(['opportunity', id], {
          ...previousOpportunity,
          _count: {
            ...previousOpportunity._count,
            applications: (previousOpportunity._count?.applications ?? 0) + 1,
          },
        });
      }

      return { previousMyApplications, previousOpportunity };
    },
    onError: (e: unknown, _variables: unknown, context) => {
      if (context?.previousMyApplications) {
        qc.setQueryData(['my-applications'], context.previousMyApplications);
      }
      if (context?.previousOpportunity) {
        qc.setQueryData(['opportunity', id], context.previousOpportunity);
      }

      const axiosError = e as { response?: { data?: { error?: string } } };
      toast({
        title: 'Failed',
        description: axiosError?.response?.data?.error ?? 'Try again',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Applied!', description: 'Your application has been submitted.' });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['my-applications'] });
      qc.invalidateQueries({ queryKey: ['opportunity', id] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const withdraw = useMutation({
    mutationFn: () => api.delete(`/opportunities/applications/${myApp!.id}`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['my-applications'] });
      await qc.cancelQueries({ queryKey: ['opportunity', id] });

      const previousMyApplications = qc.getQueryData<ApplicationInfo[]>(['my-applications']);
      const previousOpportunity = qc.getQueryData<OpportunityInfo>(['opportunity', id]);

      qc.setQueryData<ApplicationInfo[]>(['my-applications'], (old = []) =>
        old.filter((a) => a.opportunityId !== id)
      );

      if (previousOpportunity) {
        qc.setQueryData<OpportunityInfo>(['opportunity', id], {
          ...previousOpportunity,
          _count: {
            ...previousOpportunity._count,
            applications: Math.max(0, (previousOpportunity._count?.applications ?? 1) - 1),
          },
        });
      }

      return { previousMyApplications, previousOpportunity };
    },
    onError: (e: unknown, _variables: unknown, context) => {
      if (context?.previousMyApplications) {
        qc.setQueryData(['my-applications'], context.previousMyApplications);
      }
      if (context?.previousOpportunity) {
        qc.setQueryData(['opportunity', id], context.previousOpportunity);
      }
      const axiosError = e as { response?: { data?: { error?: string } } };
      toast({
        title: 'Failed',
        description: axiosError?.response?.data?.error ?? 'Could not withdraw. Try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Withdrawn', description: 'Your application has been withdrawn.' });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['my-applications'] });
      qc.invalidateQueries({ queryKey: ['opportunity', id] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  if (isLoading)
    return (
      <div className="max-w-2xl space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  if (!opp) return <div className="text-brand-muted text-sm">Opportunity not found.</div>;

  const slotsLeft = opp.totalSlots - (opp._count?.applications ?? 0);
  const isFull = slotsLeft <= 0;
  const isClosed = opp.status !== 'ACTIVE';

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/volunteer/opportunities"
        onClick={() => haptic.light()}
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Opportunities
      </Link>

      {/* Header */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-bg flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6 text-brand-primary" />
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[opp.category] ?? CATEGORY_COLORS.OTHER}`}
          >
            {opp.category}
          </span>
        </div>

        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-text">{opp.title}</h1>
          <p className="text-sm text-brand-muted mt-1">by {opp.createdBy?.name}</p>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
          <div className="flex items-center gap-2 text-brand-muted">
            <Calendar className="w-4 h-4 text-brand-primary flex-shrink-0" />
            <span>
              {new Date(opp.startDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              –{' '}
              {new Date(opp.endDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-brand-muted">
            <Clock className="w-4 h-4 text-brand-primary flex-shrink-0" />
            <span>{opp.hoursPerSession}h per session</span>
          </div>
          <div className="flex items-center gap-2 text-brand-muted">
            <Users className="w-4 h-4 text-brand-primary flex-shrink-0" />
            <span>{isFull ? 'Full' : `${slotsLeft} of ${opp.totalSlots} slots left`}</span>
          </div>
          <div className="flex items-center gap-2 text-brand-muted">
            {opp.isRemote ? (
              <>
                <Wifi className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span>Remote</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span>{opp.location?.name ?? 'On-site'}</span>
              </>
            )}
          </div>
        </div>

        {/* Apply button */}
        <div className="pt-2">
          {myApp ? (
            <div className="space-y-2">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                ${myApp.status === 'ACCEPTED' ? 'bg-brand-primary/10 text-brand-primary' : myApp.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}
              >
                {myApp.status === 'ACCEPTED'
                  ? '✓ Accepted'
                  : myApp.status === 'REJECTED'
                    ? '✗ Rejected'
                    : '⏳ Application Pending'}
              </div>
              {myApp.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Withdraw your application?')) {
                      haptic.error();
                      withdraw.mutate(undefined);
                    }
                  }}
                  disabled={withdraw.isPending}
                  className="block text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {withdraw.isPending ? 'Withdrawing…' : 'Withdraw Application'}
                </button>
              )}
            </div>
          ) : isClosed ? (
            <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground">
              Closed
            </span>
          ) : isFull ? (
            <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground">
              No slots available
            </span>
          ) : (
            <button
              type="button"
              onClick={() => { haptic.medium(); apply.mutate(undefined); }}
              disabled={apply.isPending}
              className="bg-brand-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-secondary transition-colors cursor-pointer disabled:opacity-60"
            >
              {apply.isPending ? 'Applying…' : 'Apply Now'}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 space-y-2">
        <h2 className="font-heading font-semibold text-sm text-brand-text">
          About this opportunity
        </h2>
        <p className="text-sm text-brand-muted leading-relaxed whitespace-pre-line">
          {opp.description}
        </p>
      </div>

        {/* Chat link for accepted volunteers */}
        {myApp?.status === 'ACCEPTED' && (
          <Link
            href={`/volunteer/opportunities/${id}/chat`}
            onClick={() => haptic.light()}
            className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-secondary transition-colors pt-1"
          >
            <MessageCircle className="w-4 h-4" /> Join Discussion
          </Link>
        )}

        {/* Skills */}
      {opp.skills?.length > 0 && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 space-y-3">
          <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-primary" /> Skills needed
          </h2>
          <div className="flex flex-wrap gap-2">
            {opp.skills.map((s: string) => (
              <span
                key={s}
                className="text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
