'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  ACCEPTED: 'bg-brand-primary/10 text-brand-primary',
  REJECTED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  PENDING: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
};

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  PENDING: 'Pending',
};

interface Application {
  id: string;
  opportunityId: string;
  status: string;
  appliedAt: string;
  opportunity: {
    title: string;
    category: string;
  };
}

export default function MyApplicationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () =>
      api
        .get('/opportunities/my-applications')
        .then((r) => r.data)
        .catch(() => []),
  });

  const applications: Application[] = Array.isArray(data) ? data : (data?.data ?? []);

  if (isLoading)
    return (
      <div className="max-w-2xl space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );

  if (applications.length === 0)
    return (
      <div className="max-w-2xl">
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-8 text-center">
          <p className="text-brand-muted text-sm">No applications yet.</p>
          <Link
            href="/volunteer/opportunities"
            className="mt-4 inline-block text-sm font-medium text-brand-primary hover:text-brand-secondary transition-colors"
          >
            Browse Opportunities
          </Link>
        </div>
      </div>
    );

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-heading font-bold text-xl text-brand-text">My Applications</h1>

      {applications.map((app) => (
        <Link
          key={app.id}
          href={`/volunteer/opportunities/${app.opportunityId}`}
          className="block bg-brand-surface rounded-2xl border border-brand-border p-5 hover:border-brand-primary/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-heading font-semibold text-sm text-brand-text truncate">
                {app.opportunity.title}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-brand-muted">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Applied{' '}
                  {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[app.status] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {STATUS_LABELS[app.status] ?? app.status}
              </span>
              <ExternalLink className="w-4 h-4 text-brand-muted flex-shrink-0" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
