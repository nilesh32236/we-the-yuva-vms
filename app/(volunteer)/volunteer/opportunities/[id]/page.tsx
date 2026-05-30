'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Calendar, Clock, MapPin, Tag, Users, Wifi } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { SkeletonCard } from '../../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';

const CATEGORY_COLORS: Record<string, string> = {
  EDUCATION: 'bg-blue-100 text-blue-700',
  HEALTH: 'bg-red-100 text-red-700',
  ENVIRONMENT: 'bg-green-100 text-green-700',
  COMMUNITY: 'bg-orange-100 text-orange-700',
  ARTS: 'bg-purple-100 text-purple-700',
  SPORTS: 'bg-yellow-100 text-yellow-700',
  TECHNOLOGY: 'bg-cyan-100 text-cyan-700',
  OTHER: 'bg-gray-100 text-gray-700',
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

  const myApp = (myApplications ?? []).find(
    (a: { opportunityId: string; status: string }) => a.opportunityId === id
  );

  const apply = useMutation({
    mutationFn: () => api.post(`/opportunities/${id}/apply`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-applications'] });
      qc.invalidateQueries({ queryKey: ['opportunity', id] });
      toast({ title: 'Applied!', description: 'Your application has been submitted.' });
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({
        title: 'Failed',
        description: e?.response?.data?.error ?? 'Try again',
        variant: 'destructive',
      }),
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
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Opportunities
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-brand-border p-6 space-y-4">
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
        <div className="grid grid-cols-2 gap-3 text-sm">
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
            <div
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
              ${myApp.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : myApp.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
            >
              {myApp.status === 'ACCEPTED'
                ? '✓ Accepted'
                : myApp.status === 'REJECTED'
                  ? '✗ Rejected'
                  : '⏳ Application Pending'}
            </div>
          ) : isClosed ? (
            <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500">
              Closed
            </span>
          ) : isFull ? (
            <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500">
              No slots available
            </span>
          ) : (
            <button
              type="button"
              onClick={() => apply.mutate()}
              disabled={apply.isPending}
              className="bg-brand-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-secondary transition-colors cursor-pointer disabled:opacity-60"
            >
              {apply.isPending ? 'Applying…' : 'Apply Now'}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-brand-border p-6 space-y-2">
        <h2 className="font-heading font-semibold text-sm text-brand-text">
          About this opportunity
        </h2>
        <p className="text-sm text-brand-muted leading-relaxed whitespace-pre-line">
          {opp.description}
        </p>
      </div>

      {/* Skills */}
      {opp.skills?.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-border p-6 space-y-3">
          <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-primary" /> Skills needed
          </h2>
          <div className="flex flex-wrap gap-2">
            {opp.skills.map((s: string) => (
              <span
                key={s}
                className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full"
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
