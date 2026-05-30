'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../hooks/use-toast';
import { api } from '../../../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  DRAFT: 'bg-yellow-100 text-yellow-700',
};

export default function AdminOpportunitiesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [closing, setClosing] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-opportunities', search, page],
    queryFn: () =>
      api
        .get('/opportunities', { params: { search: search || undefined, page, limit: 20 } })
        .then((r) => r.data),
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
      qc.invalidateQueries({ queryKey: ['admin-opportunities'] });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setClosing(null);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <h1 className="font-heading font-bold text-xl text-brand-text">All Opportunities</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !data?.data?.length ? (
        <div className="text-center py-12 text-brand-muted text-sm">No opportunities found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="bg-white rounded-2xl border border-brand-border">
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
                      className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell"
                    >
                      Created by
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
                    <th scope="col" className="px-4 py-3 w-12" />
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
                      createdBy?: { name: string };
                      _count?: { applications: number };
                    }) => (
                      <tr key={opp.id} className="hover:bg-brand-bg/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-brand-text max-w-[180px] truncate">
                          {opp.title}
                        </td>
                        <td className="px-4 py-3 text-brand-muted hidden sm:table-cell">
                          {opp.category}
                        </td>
                        <td className="px-4 py-3 text-brand-muted hidden md:table-cell">
                          {opp.createdBy?.name ?? '—'}
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
                          {opp.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleClose(opp.id, opp.title)}
                              disabled={closing === opp.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-brand-muted hover:text-red-600 transition-colors cursor-pointer"
                              title="Close"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {data?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-brand-border text-sm disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-brand-muted">
                Page {page} of {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 rounded-xl border border-brand-border text-sm disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="font-semibold text-lg mb-2">Confirm</h3>
            <p className="text-sm text-gray-600 mb-4">Close &ldquo;{confirmAction.title}&rdquo;?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm rounded-lg border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeClose}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white"
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
