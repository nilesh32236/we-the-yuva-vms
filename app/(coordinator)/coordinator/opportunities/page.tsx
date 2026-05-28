'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../hooks/use-toast';
import { api } from '../../../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  DRAFT: 'bg-yellow-100 text-yellow-700',
};

export default function CoordinatorOpportunitiesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [closing, setClosing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['coordinator-opportunities'],
    queryFn: () => api.get('/opportunities', { params: { limit: 50 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const handleClose = async (id: string, title: string) => {
    if (!confirm(`Close "${title}"? This cannot be undone.`)) return;
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
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Opportunity
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border p-12 text-center">
          <p className="font-medium text-brand-text">No opportunities yet</p>
          <p className="text-sm text-brand-muted mt-1">
            Create your first opportunity to get started
          </p>
        </div>
      ) : (
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
                                href={`/coordinator/opportunities/${opp.id}/edit`}
                                className="p-1.5 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleClose(opp.id, opp.title)}
                                disabled={closing === opp.id}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-brand-muted hover:text-red-600 transition-colors cursor-pointer"
                                title="Close"
                              >
                                <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
