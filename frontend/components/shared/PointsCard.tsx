'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Award } from 'lucide-react';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { captureApiError } from '@/lib/sentry';

interface PointsResponse {
  currentPoints: number;
  totalEarned: number;
}

export function PointsCard() {
  const { data, isLoading, isError, error, refetch } = useQuery<PointsResponse>({
    queryKey: ['my-points'],
    queryFn: () => api.get('/levels/users/me/points').then((r) => r.data),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isError && error) {
      captureApiError(error, 'points query failed');
    }
  }, [error, isError]);

  if (isLoading) {
    return (
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 flex items-center gap-4 card-hover">
        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
          <Award className="w-6 h-6 text-brand-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-16" aria-hidden="true" />
          <Skeleton className="h-3 w-12" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 flex items-center gap-4 card-hover">
        <div className="w-12 h-12 rounded-xl bg-brand-error/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-brand-error" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-brand-error">
            {(error as { normalizedMessage?: string } | null)?.normalizedMessage ??
              'Failed to load points'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-brand-muted text-xs mt-1 underline h-auto min-h-0 px-0 py-0 hover:bg-transparent"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 flex items-center gap-4 card-hover">
      <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
        <Award className="w-6 h-6 text-brand-primary" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading font-bold text-2xl text-brand-primary leading-none tabular-nums">
          {data?.currentPoints ?? 0}
        </p>
        <p className="text-brand-muted text-xs mt-1 truncate">Points</p>
      </div>
    </div>
  );
}
