'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { EventCard } from '../../../../components/events/EventCard';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { api } from '../../../../lib/api';

interface ObserverEvent {
  id: string;
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: string;
  isVirtual: boolean;
  venue?: string | null;
  meetingLink?: string | null;
  capacity: number;
  opportunity: { title: string };
  _count: { attendances: number };
  attendance?: { attended: boolean } | null;
}

export default function ObserverEventsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['events', 'observer', page],
    queryFn: () => api.get('/events', { params: { page, limit: 20 } }).then((r) => r.data),
    staleTime: 60_000,
  });

  const now = new Date();
  const all = (data?.data ?? []) as ObserverEvent[];
  const upcoming = all.filter((e) => new Date(e.eventDate) >= now);
  const past = all.filter((e) => new Date(e.eventDate) < now);
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-5 max-w-4xl">
      <h1 className="font-heading font-bold text-xl text-brand-text">Events</h1>

      <div className="flex gap-1 bg-brand-bg rounded-xl p-1 w-fit">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
              ${tab === t ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 text-brand-muted">
          <p>No {tab} events</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {shown.map((e: ObserverEvent) => (
              <EventCard key={e.id} event={e} />
            ))}
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
    </div>
  );
}
