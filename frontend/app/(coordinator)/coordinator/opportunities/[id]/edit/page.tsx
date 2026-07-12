'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { OpportunityInput } from '@/lib/shared';
import { OpportunityForm } from '../../../../../../components/opportunities/OpportunityForm';
import { haptic } from '../../../../../../lib/haptic';
import { useToast } from '../../../../../../hooks/use-toast';
import { api } from '../../../../../../lib/api';

export default function EditOpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: opp, isLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => api.get(`/opportunities/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const handleSubmit = async (data: OpportunityInput) => {
    haptic.medium();
    try {
      await api.put(`/opportunities/${id}`, data);
      toast({ title: 'Opportunity updated!' });
      router.push('/coordinator/opportunities');
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
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 card-hover">
          <div className="h-6 w-48 bg-brand-bg rounded animate-pulse mb-5" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-brand-bg rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="max-w-2xl space-y-5">
        <Link
          href="/coordinator/opportunities"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer active-bounce"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
        </Link>
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center card-hover">
          <p className="text-brand-muted">Opportunity not found</p>
        </div>
      </div>
    );
  }

  const toDatetimeLocal = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const defaultValues: Partial<OpportunityInput> = {
    title: opp.title,
    description: opp.description,
    skills: opp.skills,
    category: opp.category,
    locationId: opp.locationId ?? undefined,
    startDate: toDatetimeLocal(opp.startDate),
    endDate: toDatetimeLocal(opp.endDate),
    hoursPerSession: opp.hoursPerSession,
    totalSlots: opp.totalSlots,
    isRemote: opp.isRemote,
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/coordinator/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer active-bounce"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
      </Link>
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 card-hover">
        <h1 className="font-heading font-bold text-xl text-brand-text mb-5">Edit Opportunity</h1>
        <OpportunityForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitLabel="Update Opportunity"
        />
      </div>
    </div>
  );
}
