'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Button } from '@/components/ui/Button';
import { haptic } from '@/lib/haptic';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const STATUS_BADGES: Record<string, string> = {
  PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  ACCEPTED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  REJECTED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

interface Application {
  id: string;
  volunteer: { name: string; email?: string };
  status: string;
  appliedAt: string;
}

interface ApplicationsResponse {
  data: Application[];
  totalPages: number;
  page: number;
  limit: number;
  total: number;
}

export default function ApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<ApplicationsResponse>({
    queryKey: ['opportunity-applications', id, page],
    queryFn: () =>
      api
        .get(`/opportunities/${id}/applications`, { params: { page, limit: 20 } })
        .then((r) => r.data),
    enabled: !!id,
  });

  const updateMut = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      api.patch(`/opportunities/${id}/applications/${appId}`, { status }),
    onSuccess: () => {
      toast({ title: 'Application updated' });
      qc.invalidateQueries({ queryKey: ['opportunity-applications', id] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Could not update application.',
        variant: 'destructive',
      });
    },
  });

  const applications = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-5 max-w-5xl">
      <Link
        href="/coordinator/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer active-bounce"
        onClick={() => haptic.light()}
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Opportunities
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl text-brand-text">Applications</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center card-hover">
          <p className="font-medium text-brand-text">No applications yet</p>
          <p className="text-sm text-brand-muted mt-1">
            Applications will appear here when volunteers apply
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="bg-brand-surface rounded-2xl border border-brand-border card-hover">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-bg">
                    <th
                      scope="col"
                      className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
                    >
                      Volunteer
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden sm:table-cell"
                    >
                      Applied
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
                    >
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 w-32" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-brand-bg/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-brand-text">
                        {app.volunteer.name}
                      </td>
                      <td className="px-4 py-3 text-brand-muted hidden sm:table-cell">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGES[app.status] ?? ''}`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {app.status === 'PENDING' && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="primary"
                              loading={updateMut.isPending}
                              onClick={() => {
                                haptic.medium();
                                updateMut.mutate({ appId: app.id, status: 'ACCEPTED' });
                              }}
                            >
                              <Check className="w-3.5 h-3.5" aria-hidden="true" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              loading={updateMut.isPending}
                              onClick={() => {
                                haptic.medium();
                                updateMut.mutate({ appId: app.id, status: 'REJECTED' });
                              }}
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" /> Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-brand-border text-sm font-medium disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors active-bounce"
              >
                Previous
              </button>
              <span className="text-sm text-brand-muted">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-brand-border text-sm font-medium disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors active-bounce"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
