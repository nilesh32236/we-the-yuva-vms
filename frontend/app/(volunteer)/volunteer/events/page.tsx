'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CalendarX,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  MessageSquare,
  Repeat,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Pagination from '../../../../components/shared/Pagination';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../hooks/use-toast';
import { api } from '../../../../lib/api';
import { haptic } from '@/lib/haptic';
import { AddToCalendarButton } from '../../../../components/events/AddToCalendarButton';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  COMPLETED: 'bg-brand-primary/10 text-brand-primary',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

function getLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

interface VolunteerEvent {
  id: string;
  title: string;
  status: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  isVirtual: boolean;
  seriesId?: string | null;
  venue?: string;
  meetingLink?: string;
  opportunity?: { title: string };
  attendances?: {
    checkedInAt: string | null;
    checkedOutAt: string | null;
    checkInLat?: number;
    checkInLng?: number;
    checkOutLat?: number;
    checkOutLng?: number;
  }[];
}

function EventRow({ event }: { event: VolunteerEvent }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [locating, setLocating] = useState(false);

  const attendance = event.attendances?.[0];
  const isCheckedIn = !!attendance?.checkedInAt;
  const isCheckedOut = !!attendance?.checkedOutAt;
  const isPast = new Date(event.eventDate) < new Date();
  const isCancelled = event.status === 'CANCELLED';

  const checkIn = useMutation({
    mutationFn: (body: object) => api.post(`/events/${event.id}/checkin`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-events'] });
      toast({ title: 'Checked in!', description: 'Your check-in has been recorded.' });
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({
        title: 'Check-in failed',
        description: e?.response?.data?.error ?? 'Try again',
        variant: 'destructive',
      }),
  });

  const checkOut = useMutation({
    mutationFn: (body: object) => api.post(`/events/${event.id}/checkout`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-events'] });
      toast({ title: 'Checked out!', description: 'Your hours have been recorded.' });
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast({
        title: 'Check-out failed',
        description: e?.response?.data?.error ?? 'Try again',
        variant: 'destructive',
      }),
  });

  async function handleCheckIn() {
    haptic.medium();
    setLocating(true);
    const location = await getLocation();
    setLocating(false);
    checkIn.mutate(location ?? {});
  }

  async function handleCheckOut() {
    haptic.medium();
    setLocating(true);
    const location = await getLocation();
    setLocating(false);
    checkOut.mutate(location ?? {});
  }

  const busy = locating || checkIn.isPending || checkOut.isPending;

  return (
    <div
      className={`bg-brand-surface rounded-2xl border p-5 space-y-3 transition-all card-hover ${isCancelled ? 'opacity-60' : 'hover:shadow-md hover:border-brand-primary/30 border-brand-border'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[event.status] ?? STATUS_COLORS.SCHEDULED}`}
        >
          {event.status}
        </span>
        {event.seriesId && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center gap-1">
            <Repeat className="w-3 h-3" aria-hidden="true" /> Recurring
          </span>
        )}
        {isCheckedOut ? (
          <span className="text-xs font-semibold bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full">
            Completed
          </span>
        ) : isCheckedIn ? (
          <span className="text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Checked In
          </span>
        ) : null}
      </div>

      <div>
        <h3 className="font-heading font-semibold text-brand-text">{event.title}</h3>
        {event.opportunity && (
          <p className="text-xs text-brand-muted mt-0.5">{event.opportunity.title}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-muted">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(event.eventDate).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {event.startTime} – {event.endTime}
        </span>
        {event.isVirtual ? (
          <span className="flex items-center gap-1 text-brand-primary">
            <Video className="w-3 h-3" />
            Virtual
          </span>
        ) : (
          event.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.venue}
            </span>
          )
        )}
      </div>

      {(isCheckedIn || isCheckedOut) && (
        <div className="bg-brand-bg rounded-xl px-4 py-3 text-xs space-y-1.5">
          {attendance.checkedInAt && (
            <div className="flex items-center justify-between">
              <span className="text-brand-muted flex items-center gap-1.5">
                <LogIn className="w-3 h-3 text-brand-primary" />
                Checked in
              </span>
              <span className="font-medium text-brand-text">
                {new Date(attendance.checkedInAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {attendance.checkInLat && (
                  <span className="text-brand-muted ml-1.5">
                    📍 {attendance.checkInLat.toFixed(4)}, {attendance.checkInLng?.toFixed(4)}
                  </span>
                )}
              </span>
            </div>
          )}
          {attendance.checkedOutAt && (
            <div className="flex items-center justify-between">
              <span className="text-brand-muted flex items-center gap-1.5">
                <LogOut className="w-3 h-3 text-brand-error" />
                Checked out
              </span>
              <span className="font-medium text-brand-text">
                {new Date(attendance.checkedOutAt!).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {attendance.checkOutLat && (
                  <span className="text-brand-muted ml-1.5">
                    📍 {attendance.checkOutLat.toFixed(4)}, {attendance.checkOutLng?.toFixed(4)}
                  </span>
                )}
              </span>
            </div>
          )}
          {isCheckedIn && isCheckedOut && (
            <div className="flex items-center justify-between pt-1 border-t border-brand-border">
              <span className="text-brand-muted">Duration</span>
              <span className="font-semibold text-brand-primary">
                {(
                  (new Date(attendance.checkedOutAt!).getTime() -
                    new Date(attendance.checkedInAt!).getTime()) /
                  3_600_000
                ).toFixed(1)}
                h
              </span>
            </div>
          )}
        </div>
      )}

      {isPast && isCheckedOut && (
        <Link
          href={`/volunteer/events/${event.id}/feedback`}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-primary border border-brand-primary/30 px-4 py-2 rounded-xl hover:bg-brand-primary/5 transition-colors cursor-pointer w-fit"
        >
          <MessageSquare className="w-4 h-4" /> Give Feedback
        </Link>
      )}

      <div className="flex items-center gap-2 pt-1">
        <AddToCalendarButton eventId={event.id} label="Add to Calendar" />
      </div>

      {!isCancelled && !isPast && (
        <div className="flex gap-2 pt-1">
          {!isCheckedIn && (
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={busy}
              className="flex items-center gap-1.5 text-sm font-medium bg-brand-primary text-white px-4 py-2 rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              {busy ? 'Locating…' : 'Check In'}
            </button>
          )}
          {isCheckedIn && !isCheckedOut && (
            <button
              type="button"
              onClick={handleCheckOut}
              disabled={busy}
              className="flex items-center gap-1.5 text-sm font-medium bg-brand-error text-white px-4 py-2 rounded-xl hover:bg-brand-error/80 transition-colors cursor-pointer disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" />
              {busy ? 'Locating…' : 'Check Out'}
            </button>
          )}
          {event.isVirtual && event.meetingLink && (
            <a
              href={event.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium border border-brand-border text-brand-text px-4 py-2 rounded-xl hover:bg-brand-bg transition-colors cursor-pointer"
            >
              <Video className="w-4 h-4" /> Join
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function VolunteerEventsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-events', page],
    queryFn: () => api.get('/users/me/events', { params: { page, limit: 20 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const events: VolunteerEvent[] = data?.data ?? [];
  const now = new Date();
  const upcoming = events.filter(
    (e: VolunteerEvent) => new Date(e.eventDate) >= now && e.status !== 'CANCELLED'
  );
  const past = events.filter(
    (e: VolunteerEvent) => new Date(e.eventDate) < now || e.status === 'CANCELLED'
  );

  if (isLoading)
    return (
      <div className="space-y-4 max-w-3xl">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-8 text-destructive max-w-3xl">
        Failed to load events. Please try again later.
      </div>
    );

  return (
    <div className="space-y-8 max-w-3xl">
      <section>
        <h2 className="font-heading font-bold text-lg text-brand-text mb-4">Upcoming Events</h2>
        {upcoming.length === 0 ? (
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-10 text-center">
            <CalendarX className="w-10 h-10 mx-auto mb-3 text-brand-muted opacity-50" />
            <p className="font-medium text-brand-text">No upcoming events</p>
            <p className="text-sm text-brand-muted mt-1">Browse opportunities to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((e: VolunteerEvent) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="font-heading font-bold text-lg text-brand-text mb-4">Past Events</h2>
          <div className="space-y-3">
            {past.map((e: VolunteerEvent) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
      <Pagination page={page} totalPages={data?.totalPages ?? 0} setPage={setPage} />
    </div>
  );
}
