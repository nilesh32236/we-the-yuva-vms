'use client';

import type { EventInput } from '@/lib/shared';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { EventForm } from '../../../../../../components/events/EventForm';
import { useToast } from '../../../../../../hooks/use-toast';
import { api } from '../../../../../../lib/api';

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const handleSubmit = async (data: EventInput) => {
    try {
      await api.put(`/events/${id}`, data);
      toast({ title: 'Event updated!' });
      router.push('/coordinator/events');
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-5">
        <div className="bg-white rounded-2xl border border-brand-border p-6">
          <div className="h-6 w-40 bg-brand-bg rounded animate-pulse mb-5" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-brand-bg rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl space-y-5">
        <Link
          href="/coordinator/events"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="bg-white rounded-2xl border border-brand-border p-12 text-center">
          <p className="text-brand-muted">Event not found</p>
        </div>
      </div>
    );
  }

  const defaultValues: Partial<EventInput> = {
    title: event.title,
    description: event.description ?? undefined,
    eventDate: new Date(event.eventDate).toISOString(),
    startTime: event.startTime,
    endTime: event.endTime,
    venue: event.venue ?? undefined,
    capacity: event.capacity,
    isVirtual: event.isVirtual,
    meetingLink: event.meetingLink ?? undefined,
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/coordinator/events"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="bg-white rounded-2xl border border-brand-border p-6">
        <h1 className="font-heading font-bold text-xl text-brand-text mb-5">Edit Event</h1>
        <EventForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitLabel="Update Event"
        />
      </div>
    </div>
  );
}
