'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Video,
  Building2,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatsCard } from '@/components/charts/StatsCard';
import { api } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  COMPLETED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  SCHEDULED: Clock,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  meetingLink: string | null;
  isVirtual: boolean;
  capacity: number;
  status: string;
  opportunity: {
    title: string;
    organization: { name: string } | null;
    createdBy: { name: string } | null;
  };
  _count: { attendances: number };
}

export default function AdminEventDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-event-detail', id],
    queryFn: () => api.get(`/admin/events/${id}`).then((r) => r.data as EventDetail),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-48 bg-brand-bg rounded-lg" />
        <div className="h-40 bg-brand-surface rounded-2xl border border-brand-border" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <div key={i} className="h-24 bg-brand-surface rounded-2xl border border-brand-border" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-40" />
        <p className="font-medium text-brand-text mb-1">Failed to load event</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary cursor-pointer transition-colors shadow-sm mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <Calendar className="w-16 h-16 text-brand-muted mx-auto mb-4 opacity-20" />
        <p className="font-medium text-brand-text">Event not found</p>
        <Link
          href="/admin/events"
          className="text-brand-primary text-sm mt-2 inline-block hover:underline"
        >
          Back to events
        </Link>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[event.status] ?? Clock;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-7 h-7 text-orange-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading font-bold text-2xl text-brand-text">{event.title}</h1>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${STATUS_STYLES[event.status] ?? ''}`}
              >
                <StatusIcon className="w-3 h-3" />
                {event.status}
              </span>
            </div>
            {event.opportunity?.organization && (
              <p className="flex items-center gap-1.5 text-sm text-brand-muted mt-1">
                <Building2 className="w-3.5 h-3.5" />
                {event.opportunity.organization.name}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-brand-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(event.eventDate).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {event.startTime && ` ${event.startTime}`}
                {event.endTime && ` - ${event.endTime}`}
              </span>
              {event.isVirtual && event.meetingLink ? (
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" />
                  <a
                    href={event.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-primary transition-colors"
                  >
                    Online
                  </a>
                </span>
              ) : event.venue ? (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.venue}
                </span>
              ) : null}
              <span>Created by: {event.opportunity?.createdBy?.name ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Registrations"
          value={event._count?.attendances ?? 0}
          icon={UserCheck}
          accent="text-blue-500"
          accentBg="bg-blue-50 dark:bg-blue-950"
        />
        <StatsCard
          label="Capacity"
          value={event.capacity}
          icon={Users}
          accent="text-purple-500"
          accentBg="bg-purple-50 dark:bg-purple-950"
        />
        <StatsCard
          label="Opportunity"
          value={event.opportunity?.title ?? '—'}
          icon={Calendar}
          accent="text-orange-500"
          accentBg="bg-orange-50 dark:bg-orange-950"
        />
      </div>

      {event.description && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
          <h2 className="font-heading font-bold text-lg text-brand-text mb-3">Description</h2>
          <p className="text-sm text-brand-muted whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <h2 className="font-heading font-bold text-lg text-brand-text mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/events/${id}/edit`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary transition-colors shadow-sm"
          >
            Edit Event
          </Link>
        </div>
      </div>
    </div>
  );
}
