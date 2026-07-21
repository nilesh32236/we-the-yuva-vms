// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';
import Pagination from '@/components/shared/Pagination';
import { EventCard } from '@/components/events/EventCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api';

const ObserverEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  eventDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.string(),
  isVirtual: z.boolean(),
  venue: z.string().nullable().optional(),
  meetingLink: z.string().nullable().optional(),
  capacity: z.number(),
  opportunity: z.object({ title: z.string() }),
  _count: z.object({ attendances: z.number() }),
  attendance: z.object({ attended: z.boolean() }).nullable().optional(),
});
type ObserverEvent = z.infer<typeof ObserverEventSchema>;

export default function ObserverEventsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [page, setPage] = useState(1);
  const handleTabChange = (t: 'upcoming' | 'past') => setTab(t);

  const { data, isLoading } = useQuery({
    queryKey: ['events', 'observer', page],
    queryFn: () => api.get('/events', { params: { page, limit: 20 } }).then((r) => r.data),
    staleTime: 60_000,
  });

  const now = new Date();
  const raw = (data?.data ?? []) as unknown[];
  const all = raw.map((item) => ObserverEventSchema.parse(item));
  const upcoming = all.filter((e) => new Date(e.eventDate) >= now);
  const past = all.filter((e) => new Date(e.eventDate) < now);
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-5 max-w-4xl">
      <h1 className="font-heading font-bold text-xl text-brand-text">Events</h1>

      <div className="flex gap-1 bg-brand-bg rounded-xl p-1 w-fit" role="tablist">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            type="button"
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => handleTabChange(t)}
            className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer active-bounce
              ${tab === t ? 'bg-brand-surface text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
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
        <div className="text-center py-16 text-brand-muted" role="status">
          <p>No {tab} events</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {shown.map((e: ObserverEvent) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
          <Pagination page={page} totalPages={data.totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}
