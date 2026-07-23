'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-brand-primary/10 text-brand-primary',
  CLOSED: 'bg-brand-muted/10 text-brand-muted',
  DRAFT: 'bg-brand-cta/10 text-brand-cta',
};

export default function CoordinatorOpportunitiesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [closing, setClosing] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; title: string } | null>(null);
  const [page, setPage] = useState(1);
  const closeDialogRef = useFocusTrap(!!confirmAction);

  const { data, isLoading } = useQuery({
    queryKey: ['coordinator-opportunities', page],
    queryFn: () => api.get('/opportunities', { params: { limit: 50, page } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const handleClose = async (id: string, title: string) => {
    setConfirmAction({ id, title });
  };

  const executeClose = async () => {
    if (!confirmAction) return;
    const { id } = confirmAction;
    setConfirmAction(null);
    setClosing(id);
    try {
      await api.delete(`/opportunities/${id}`);
      toast({ title: 'Opportunity closed' });
      qc.invalidateQueries({ queryKey: ['coordinator-opportunities'] });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not close opportunity.',
        variant: 'destructive',
      });
    } finally {
      setClosing(null);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl text-brand-text">Opportunities</h1>
        <Link
          href="/coordinator/opportunities/new"
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer active-bounce"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> New Opportunity
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center card-hover">
          <p className="font-medium text-brand-text">No opportunities yet</p>
          <p className="text-sm text-brand-muted mt-1">
            Create your first opportunity to get started
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="bg-brand-surface rounded-2xl border border-brand-border card-hover">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-bg">
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
                  >
                    Title
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden sm:table-cell"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell"
                  >
                    Slots
                  </th>
                  <th scope="col" className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {data?.data?.map(
                  (opp: {
                    id: string;
                    title: string;
                    category: string;
                    status: string;
                    totalSlots: number;
                    _count?: { applications: number };
                  }) => (
                    <tr key={opp.id} className="hover:bg-brand-bg/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-brand-text max-w-[200px] truncate">
                        {opp.title}
                      </td>
                      <td className="px-4 py-3 text-brand-muted hidden sm:table-cell">
                        {opp.category}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[opp.status] ?? ''}`}
                        >
                          {opp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brand-muted hidden md:table-cell">
                        {opp._count?.applications ?? 0} / {opp.totalSlots}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {opp.status === 'ACTIVE' && (
                            <>
                              <Link
                                href={`/coordinator/opportunities/${opp.id}/applications`}
                                className="p-3 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-colors active-bounce"
                                title="View Applications"
                                aria-label="View Applications"
                              >
                                <Users className="w-4 h-4" aria-hidden="true" />
                              </Link>
                              <Link
                                href={`/coordinator/opportunities/${opp.id}/edit`}
                                className="p-3 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-colors active-bounce"
                                title="Edit"
                                aria-label="Edit opportunity"
                              >
                                <Pencil className="w-4 h-4" aria-hidden="true" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleClose(opp.id, opp.title)}
                                disabled={closing === opp.id}
                                className="p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-brand-muted hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer active-bounce"
                                title="Close"
                                aria-label="Close opportunity"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={data?.totalPages ?? 0} setPage={setPage} />

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="close-dialog-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setConfirmAction(null);
          }}
        >
          <div
            ref={closeDialogRef}
            className="bg-brand-surface rounded-lg p-6 max-w-sm mx-4 shadow-xl border border-brand-border"
          >
            <h3
              id="close-dialog-title"
              className="font-heading font-bold text-lg text-brand-text mb-2"
            >
              Confirm
            </h3>
            <p className="text-sm text-brand-muted mb-4">
              Close &ldquo;{confirmAction.title}&rdquo;? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm rounded-lg border border-brand-border text-brand-text hover:bg-brand-bg cursor-pointer transition-colors active-bounce"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeClose}
                className="px-4 py-2 text-sm rounded-lg bg-brand-error text-white hover:opacity-90 cursor-pointer transition-colors active-bounce"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
