'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import { api, downloadCsv } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

export default function AdminEventsPage() {
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', page],
    queryFn: () => api.get('/events', { params: { limit: 50, page } }).then((r) => r.data),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl text-brand-text">All Events</h1>
        <button
          type="button"
          onClick={async () => {
            try {
              await downloadCsv('/events/export/csv', 'events.csv');
            } catch {
              toast({
                title: 'Error',
                description: 'Failed to export CSV',
                variant: 'destructive',
              });
            }
          }}
          className="flex items-center gap-2 border border-brand-border text-brand-text text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-bg transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {isLoading ? (
        <div aria-busy="true" role="status" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !data?.data?.length ? (
        <div className="text-center py-12 text-brand-muted text-sm">No events found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="bg-brand-surface rounded-2xl border border-brand-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-bg">
                    <th
                      scope="col"
                      className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
                    >
                      Event
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden sm:table-cell"
                    >
                      Date
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
                      Capacity
                    </th>
                    <th scope="col" className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {data?.data?.map(
                    (ev: {
                      id: string;
                      title: string;
                      eventDate: string;
                      status: string;
                      capacity: number;
                      _count?: { attendances: number };
                      opportunity?: { title: string };
                    }) => (
                      <tr key={ev.id} className="hover:bg-brand-bg/50 transition-colors">
                        <td className="px-4 py-3">
                          <p
                            className="font-medium text-brand-text truncate max-w-[200px]"
                            title={ev.title}
                          >
                            {ev.title}
                          </p>
                          {ev.opportunity && (
                            <p className="text-xs text-brand-muted truncate">
                              {ev.opportunity.title}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-brand-muted hidden sm:table-cell">
                          {new Date(ev.eventDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[ev.status] ?? ''}`}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-brand-muted hidden md:table-cell">
                          {ev._count?.attendances ?? 0} / {ev.capacity}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/events/${ev.id}`}
                            className="p-3 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-brand-primary transition-colors inline-block"
                            aria-label={`Manage ${ev.title}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={data?.totalPages ?? 0} setPage={setPage} />
        </>
      )}
    </div>
  );
}
