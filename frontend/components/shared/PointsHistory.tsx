'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, Clock } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { SkeletonCard } from './SkeletonCard';
import { captureApiError } from '@/lib/sentry';
import { Button } from '@/components/ui/Button';

interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
  reference: string | null;
  createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
  EVENT_CHECKIN: 'Event Check-in',
  EVENT_HOURS: 'Event Hours',
  FEEDBACK_SUBMITTED: 'Feedback Submitted',
  OPPORTUNITY_ACCEPTED: 'Application Accepted',
  LEVEL_UP: 'Level Up',
};

function formatReason(reason: string): string {
  if (reason.startsWith('BADGE_')) {
    return `Badge: ${reason
      .replace('BADGE_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())}`;
  }
  return (
    REASON_LABELS[reason] ??
    reason
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function PointsHistory() {
  const { data, isLoading, isError, error, refetch } = useQuery<PointTransaction[]>({
    queryKey: ['my-points-history'],
    queryFn: () => api.get('/levels/users/me/points/history').then((r) => r.data),
    staleTime: 60_000,
  });

  const formattedTx = useMemo(
    () =>
      (data ?? []).slice(0, 10).map((tx) => ({
        ...tx,
        formattedDate: new Date(tx.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      })),
    [data]
  );

  useEffect(() => {
    if (isError && error) {
      captureApiError(error, 'points history query failed');
    }
  }, [error, isError]);

  if (isLoading) {
    return (
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-primary" /> Points History
          </h2>
        </div>
        <div className="p-4">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-primary" /> Points History
          </h2>
        </div>
        <div className="p-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-brand-error">
              {(error as { normalizedMessage?: string } | null)?.normalizedMessage ??
                'Failed to load points history'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-brand-primary hover:bg-transparent hover:underline"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-primary" /> Points History
          </h2>
        </div>
        <div className="text-center py-8 text-brand-muted text-sm">No points earned yet.</div>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-border">
        <h2 className="font-heading font-semibold text-sm text-brand-text flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-primary" /> Points History
        </h2>
      </div>
      <div className="divide-y divide-brand-border">
        {formattedTx.map((tx) => (
          <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-text truncate">
                  {formatReason(tx.reason)}
                </p>
                <p className="text-xs text-brand-muted">{tx.formattedDate}</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-brand-primary flex-shrink-0">
              +{tx.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
