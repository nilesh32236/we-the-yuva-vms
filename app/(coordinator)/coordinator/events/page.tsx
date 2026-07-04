'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Download, Pencil, Plus, QrCode, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AddToCalendarButton } from '../../../../components/events/AddToCalendarButton';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../hooks/use-toast';
import { api, downloadCsv } from '../../../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  COMPLETED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

export default function CoordinatorEventsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['coordinator-events'],
    queryFn: () => api.get('/events', { params: { limit: 50 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const handleCancel = (id: string, title: string) => {
    setConfirmAction({ id, title });
  };

  const executeCancel = async () => {
    if (!confirmAction) return;
    const { id } = confirmAction;
    setConfirmAction(null);
    setCancelling(id);
    try {
      await api.delete(`/events/${id}`);
      toast({ title: 'Event cancelled' });
      qc.invalidateQueries({ queryKey: ['coordinator-events'] });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not cancel event.',
        variant: 'destructive',
      });
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl text-brand-text">Events</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadCsv('/events/export/csv', 'events.csv')}
            className="flex items-center gap-2 border border-brand-border text-brand-text text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-bg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link
            href="/coordinator/events/new"
            className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Event
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center">
          <p className="font-medium text-brand-text">No events yet</p>
          <p className="text-sm text-brand-muted mt-1">Create events from your opportunities</p>
        </div>
      ) : (
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
                    Attendance
                  </th>
                  <th scope="col" className="px-4 py-3 w-20" />
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
                        <p className="font-medium text-brand-text truncate max-w-[180px]">
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
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/coordinator/events/${ev.id}/attendance`}
                            className="flex items-center gap-1 text-xs text-brand-primary hover:underline cursor-pointer"
                          >
                            <ClipboardList className="w-3.5 h-3.5" /> Attendance
                          </Link>
                          <Link
                            href={`/coordinator/events/${ev.id}/qr`}
                            className="flex items-center gap-1 text-xs text-brand-primary hover:underline cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" /> QR
                          </Link>
                          <Link
                            href={`/coordinator/events/${ev.id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-colors"
                            title="Edit event"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          {ev.status === 'SCHEDULED' && (
                            <button
                              type="button"
                              onClick={() => handleCancel(ev.id, ev.title)}
                              disabled={cancelling === ev.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-brand-muted hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                              title="Cancel event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <AddToCalendarButton eventId={ev.id} variant="icon" />
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

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-brand-surface rounded-lg p-6 max-w-sm mx-4 shadow-xl border border-brand-border">
            <h3 className="font-heading font-bold text-lg text-brand-text mb-2">Confirm</h3>
            <p className="text-sm text-brand-muted mb-4">
              Cancel &ldquo;{confirmAction.title}&rdquo;? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm rounded-lg border border-brand-border text-brand-text hover:bg-brand-bg cursor-pointer transition-colors"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={executeCancel}
                className="px-4 py-2 text-sm rounded-lg bg-brand-error text-white hover:opacity-90 cursor-pointer transition-colors"
              >
                Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
