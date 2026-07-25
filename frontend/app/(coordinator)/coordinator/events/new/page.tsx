'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { EventInput, EventSeriesInput } from '@/lib/shared';
import { AddToCalendarButton } from '../../../../../components/events/AddToCalendarButton';
import { EventForm } from '../../../../../components/events/EventForm';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';
import { Permissions } from '@/lib/shared/permissions';

export default function NewEventPage() {
  const { toast } = useToast();
  const [opportunityId, setOpportunityId] = useState('');
  const [oppError, setOppError] = useState('');
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [createdSeriesId, setCreatedSeriesId] = useState<string | null>(null);

  const { data: oppData } = useQuery({
    queryKey: ['coordinator-opportunities'],
    queryFn: () => api.get('/opportunities', { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const opportunities =
    oppData?.data?.filter((o: { status: string }) => o.status === 'ACTIVE') ?? [];

  const handleSubmit = async (data: EventInput | EventSeriesInput) => {
    if (!opportunityId) {
      setOppError('Please select an opportunity first');
      return;
    }
    setOppError('');
    try {
      if ('frequency' in data && data.frequency) {
        const res = await api.post(`/opportunities/${opportunityId}/event-series`, data);
        toast({ title: 'Event series created!' });
        setCreatedSeriesId(res.data.id);
      } else {
        const res = await api.post(`/opportunities/${opportunityId}/events`, data);
        toast({ title: 'Event created!' });
        setCreatedEventId(res.data.id);
      }
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
            onChange={(e) => {
              setOpportunityId(e.target.value);
              setOppError('');
            }}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-background ${oppError ? 'border-brand-error' : 'border-brand-border'}`}
          >
            <option value="">Select an active opportunity...</option>
            {opportunities.map((o: { id: string; title: string }) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
          {oppError && (
            <p className="text-xs text-brand-error" role="alert">
              {oppError}
            </p>
          )}
        </div>

        {opportunityId && !createdEventId && !createdSeriesId && (
          <EventForm
            onSubmit={handleSubmit}
            submitLabel="Create Event"
            showRecurringOption
            requiredPermission={Permissions.EVENT_CREATE}
          />
        )}

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

        {createdSeriesId && (
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 text-center space-y-4 card-hover">
            <p className="font-medium text-brand-text text-lg">
              Event Series Created Successfully!
            </p>
            <Link
              href="/coordinator/events"
              className="inline-flex items-center gap-2 text-sm font-medium bg-brand-primary text-white px-4 py-2 rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer active-bounce"
            >
              Back to Events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
