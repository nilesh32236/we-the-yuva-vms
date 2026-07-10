'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { EventInput } from '@/lib/shared';
import { AddToCalendarButton } from '../../../../../components/events/AddToCalendarButton';
import { EventForm } from '../../../../../components/events/EventForm';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';

export default function NewEventPage() {
  const { toast } = useToast();
  const [opportunityId, setOpportunityId] = useState('');
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  const { data: oppData } = useQuery({
    queryKey: ['coordinator-opportunities'],
    queryFn: () => api.get('/opportunities', { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const opportunities =
    oppData?.data?.filter((o: { status: string }) => o.status === 'ACTIVE') ?? [];

  const handleSubmit = async (data: EventInput) => {
    if (!opportunityId) {
      toast({
        title: 'Error',
        description: 'Please select an opportunity first',
        variant: 'destructive',
      });
      return;
    }
    try {
      const res = await api.post(`/opportunities/${opportunityId}/events`, data);
      toast({ title: 'Event created!' });
      setCreatedEventId(res.data.id);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/coordinator/events"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer active-bounce"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
      </Link>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 space-y-6 card-hover">
        <h1 className="font-heading font-bold text-xl text-brand-text">Create Event</h1>

        <div className="space-y-1.5">
          <label htmlFor="opportunity" className="text-sm font-medium text-brand-text">
            Opportunity
          </label>
          <select
            id="opportunity"
            value={opportunityId}
            onChange={(e) => setOpportunityId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-background"
          >
            <option value="">Select an active opportunity...</option>
            {opportunities.map((o: { id: string; title: string }) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </div>

        {opportunityId && <EventForm onSubmit={handleSubmit} submitLabel="Create Event" />}

        {createdEventId && (
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 text-center space-y-4 card-hover">
            <p className="font-medium text-brand-text text-lg">Event Created Successfully!</p>
            <div className="flex items-center justify-center gap-3">
              <AddToCalendarButton eventId={createdEventId} />
              <Link
                href="/coordinator/events"
                className="flex items-center gap-2 text-sm font-medium bg-brand-primary text-white px-4 py-2 rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer active-bounce"
              >
                Back to Events
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
