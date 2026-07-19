'use client';

import * as Sentry from '@sentry/nextjs';
import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';
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
        onClick={handleDownload}
        loading={downloading}
        variant="icon"
        size="icon"
        className="w-8 h-8 min-h-0 min-w-0 p-1.5"
        title={label}
        aria-label={label}
      >
        <CalendarPlus className="w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleDownload}
      loading={downloading}
      variant="outline"
      className="gap-1.5 text-sm font-medium px-4 py-2 rounded-xl"
      aria-label={label}
    >
      <CalendarPlus className="w-4 h-4" />
      {label}
    </Button>
  );
}
