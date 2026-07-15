'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Calendar, MapPin, Users, Wifi } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { memo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';

const CATEGORY_COLORS: Record<string, string> = {
  EDUCATION: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  HEALTH: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  ENVIRONMENT: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  COMMUNITY: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  ARTS: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  SPORTS: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  TECHNOLOGY: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  ACTIVE_CITIZENSHIP: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  OTHER: 'bg-muted text-muted-foreground',
};

interface OpportunityCardProps {
  opportunity: {
    id: string;
    title: string;
    category: string;
    isRemote: boolean;
    startDate: string;
    endDate: string;
    hoursPerSession: number;
    skills: string[];
    totalSlots: number;
    location?: { name: string; district: string } | null;
    _count?: { applications: number };
    acceptedCount?: number;
    matchScore?: number;
    userApplication?: { status: string } | null;
  };
  showApply?: boolean;
  onApplied?: (id: string) => void;
  detailHref?: string;
}

interface OpportunityInfo {
  id: string;
  userApplication?: { status: string } | null;
  _count?: { applications: number };
  [key: string]: unknown;
}

interface OpportunityListData {
  data: OpportunityInfo[];
  [key: string]: unknown;
}

type OpportunityCacheData = OpportunityInfo[] | OpportunityListData;

const OpportunityCard = memo(function OpportunityCard({
  opportunity: opp,
  showApply = false,
  onApplied,
  detailHref,
}: OpportunityCardProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const applied = !!opp.userApplication;
  const acceptedCount = opp.acceptedCount ?? opp._count?.applications ?? 0;
  const filled = acceptedCount;
  const fillPct = Math.min((filled / opp.totalSlots) * 100, 100);
  const isFull = filled >= opp.totalSlots;

  const applyMutation = useMutation({
    mutationFn: () => api.post(`/opportunities/${opp.id}/apply`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['opportunities'] });

      const previousQueries = qc.getQueriesData<OpportunityCacheData>({
        queryKey: ['opportunities'],
        exact: true,
      });

      qc.setQueriesData<OpportunityCacheData>(
        { queryKey: ['opportunities'], exact: true },
        (oldData) => {
          if (!oldData) return oldData;

          if (Array.isArray(oldData)) {
            return oldData.map((item) => {
              if (item.id === opp.id) {
                return {
                  ...item,
                  userApplication: { status: 'PENDING' },
                  acceptedCount: item.acceptedCount ?? item._count?.applications ?? 0,
                  _count: {
                    ...item._count,
                    applications: (item._count?.applications ?? 0) + 1,
                  },
                };
              }
              return item;
            });
          }

          if (oldData && Array.isArray(oldData.data)) {
            return {
              ...oldData,
              data: oldData.data.map((item) => {
                if (item.id === opp.id) {
                  return {
                    ...item,
                    userApplication: { status: 'PENDING' },
                    acceptedCount: item.acceptedCount ?? item._count?.applications ?? 0,
                    _count: {
                      ...item._count,
                      applications: (item._count?.applications ?? 0) + 1,
                    },
                  };
                }
                return item;
              }),
            };
          }

          return oldData;
        }
      );

      return { previousQueries };
    },
    onError: (err: unknown, _variables: unknown, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, queryData] of context.previousQueries) {
          qc.setQueryData(queryKey, queryData);
        }
      }

      const axiosError = err as { response?: { status?: number } };
      const status = axiosError?.response?.status;
      if (status === 409) {
        toast({
          title: 'Already applied',
          description: "You've already applied to this opportunity.",
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description:
            (err as { normalizedMessage?: string })?.normalizedMessage ??
            'Could not submit application.',
          variant: 'destructive',
        });
      }
    },
    onSuccess: () => {
      toast({ title: 'Application submitted!', description: `You applied to "${opp.title}"` });
      onApplied?.(opp.id);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.medium();
    applyMutation.mutate(undefined);
  };

  const applying = applyMutation.isPending;

  const card = (
    <div
      className={`bg-brand-surface rounded-2xl border border-brand-border p-5 flex flex-col gap-3 card-hover ${detailHref ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[opp.category] ?? CATEGORY_COLORS.OTHER}`}
        >
          {opp.category}
        </span>
        {opp.matchScore !== undefined && opp.matchScore > 0 && (
          <span className="text-xs font-semibold text-brand-primary bg-brand-bg px-2 py-0.5 rounded-full">
            {opp.matchScore}% match
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-heading font-semibold text-brand-text text-base leading-snug line-clamp-2">
        {opp.title}
      </h3>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-muted">
        {opp.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" aria-hidden="true" />
            {opp.location.name}
          </span>
        )}
        {opp.isRemote && (
          <span className="flex items-center gap-1 text-brand-primary">
            <Wifi className="w-3 h-3" aria-hidden="true" />
            Remote
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" aria-hidden="true" />
          {new Date(opp.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          {' – '}
          {new Date(opp.endDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" aria-hidden="true" />
          {opp.hoursPerSession}h/session
        </span>
      </div>

      {/* Skills */}
      {opp.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {opp.skills.slice(0, 4).map((s: string) => (
            <span
              key={s}
              className="text-xs bg-brand-bg text-brand-text border border-brand-border px-2 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
          {opp.skills.length > 4 && (
            <span className="text-xs text-brand-muted">+{opp.skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Slots progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-brand-muted">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" aria-hidden="true" />
            <span className="tabular-nums">
              {filled} / {opp.totalSlots}
            </span>{' '}
            slots
          </span>
          {isFull && <span className="text-brand-error font-medium">Full</span>}
        </div>
        <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-colors ${isFull ? 'bg-brand-error/60' : 'bg-brand-primary'}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Apply button */}
      {showApply && (
        <Button
          type="button"
          onClick={handleApply}
          disabled={applying || applied || isFull}
          loading={applying}
          aria-label={applying ? "Applying to opportunity" : undefined}
          fullWidth
          className={`mt-1 py-2 rounded-xl ${
              applied
                ? 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10 opacity-100 disabled:opacity-100 cursor-default'
                : isFull
                  ? 'bg-brand-border text-brand-muted hover:bg-brand-border opacity-100 cursor-not-allowed'
                  : ''
            }`}
        >
          {applied ? 'Applied ✓' : 'Apply Now'}
        </Button>
      )}
    </div>
  );

  if (detailHref) {
    return <Link href={detailHref}>{card}</Link>;
  }

  return card;
});

export { OpportunityCard };
