'use client';

import type { EventInput } from '@/lib/shared';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EventForm } from '../../../../../components/events/EventForm';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';

export default function NewEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [opportunityId, setOpportunityId] = useState('');

  const { data: oppData } = useQuery({
    queryKey: ['coordinator-opportunities'],
    queryFn: () => api.get('/opportunities', { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const opportunities =
    oppData?.data?.filter((o: { status: string }) => o.status === 'ACTIVE') ?? [];

  const handleSubmit = async (data: EventInput) => {
    if (!opportunityId) return;
    try {
      await api.post(`/opportunities/${opportunityId}/events`, data);
      toast({ title: 'Event created!' });
      router.push('/coordinator/events');
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
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-white rounded-2xl border border-brand-border p-6 space-y-6">
        <h1 className="font-heading font-bold text-xl text-brand-text">Create Event</h1>

        <div className="space-y-1.5">
          <label htmlFor="opportunity" className="text-sm font-medium text-brand-text">
            Opportunity
          </label>
          <select
            id="opportunity"
            value={opportunityId}
            onChange={(e) => setOpportunityId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
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
      </div>
    </div>
  );
}
