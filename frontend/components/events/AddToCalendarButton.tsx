'use client';

import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';

interface Props {
  eventId: string;
  label?: string;
  variant?: 'icon' | 'button';
}

export function AddToCalendarButton({
  eventId,
  label = 'Add to Calendar',
  variant = 'button',
}: Props) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
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
    } catch (err) {
      Sentry.captureException(err);
      toast({
        title: 'Download failed',
        description:
          (err as { normalizedMessage?: string })?.normalizedMessage ??
          'Could not download calendar file.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="icon"
        size="icon"
        onClick={handleDownload}
        disabled={downloading}
        loading={downloading}
        className="min-h-[44px] min-w-[44px] p-1.5 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-brand-text transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
        title={label}
        aria-label={label}
      >
        {!downloading && <CalendarPlus className="w-3.5 h-3.5" />}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={downloading}
      loading={downloading}
      className="flex items-center gap-1.5 text-sm font-medium border border-brand-border text-brand-text px-4 py-2 rounded-xl hover:bg-brand-bg transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
      aria-label={label}
    >
      {!downloading && <CalendarPlus className="w-4 h-4" />}
      {label}
    </Button>
  );
}
