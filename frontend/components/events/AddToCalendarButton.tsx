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
        title={label}
        aria-label={label}
        className="w-auto min-h-0 h-auto p-1.5 min-w-0"
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
      aria-label={label}
      className="rounded-xl px-4 py-2"
    >
      {!downloading && <CalendarPlus className="w-4 h-4" />}
      {label}
    </Button>
  );
}
