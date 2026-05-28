'use client';

import { memo } from 'react';
import { Calendar, Clock, MapPin, Users, Video } from 'lucide-react';
import { ApplicationStatusBadge } from '../opportunities/ApplicationStatusBadge';

const EVENT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

interface EventCardProps {
  event: {
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
  };
  showAttendance?: boolean;
}

const EventCard = memo(function EventCard({ event, showAttendance }: EventCardProps) {
  const date = new Date(event.eventDate);
  const isPast = date < new Date();

  return (
    <div
      className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200
      ${isPast ? 'border-brand-border opacity-80' : 'border-brand-border hover:shadow-md hover:border-brand-primary/30'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${EVENT_STATUS_COLORS[event.status] ?? EVENT_STATUS_COLORS.SCHEDULED}`}
        >
          {event.status}
        </span>
        {showAttendance && event.attendance !== undefined && (
          <ApplicationStatusBadge status={event.attendance?.attended ? 'ACCEPTED' : 'PENDING'} />
        )}
      </div>

      <div>
        <h3 className="font-heading font-semibold text-brand-text text-base leading-snug">
          {event.title}
        </h3>
        {event.opportunity && (
          <p className="text-xs text-brand-muted mt-0.5">{event.opportunity.title}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-muted">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {date.toLocaleDateString('en-IN', {
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
        ) : event.venue ? (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {event.venue}
          </span>
        ) : null}
        {event._count !== undefined && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {event._count.attendances} / {event.capacity}
          </span>
        )}
      </div>

      {event.isVirtual && event.meetingLink && !isPast && (
        <a
          href={event.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-primary hover:underline cursor-pointer"
        >
          Join meeting →
        </a>
      )}
    </div>
  );
});

export { EventCard };
