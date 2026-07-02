'use client';

import { CalendarPlus } from 'lucide-react';
import { api } from '../../lib/api';

interface Props {
  eventId: string;
  label?: string;
  variant?: 'icon' | 'button';
}

export function AddToCalendarButton({ eventId, label = 'Add to Calendar', variant = 'button' }: Props) {
  const handleDownload = async () => {
    try {
      const response = await api.get(`/events/${eventId}/ical`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-${eventId.slice(0, 8)}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // silently fail — user can retry
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleDownload}
        className="p-1.5 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
        title={label}
        aria-label={label}
      >
        <CalendarPlus className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="flex items-center gap-1.5 text-sm font-medium border border-brand-border text-brand-text px-4 py-2 rounded-xl hover:bg-brand-bg transition-colors cursor-pointer"
      aria-label={label}
    >
      <CalendarPlus className="w-4 h-4" />
      {label}
    </button>
  );
}
