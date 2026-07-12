'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { OpportunityInput } from '@/lib/shared';
import { OpportunityForm } from '@/components/opportunities/OpportunityForm';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function AdminEditOpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: opp, isLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => api.get(`/opportunities/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: OpportunityInput) => api.put(`/opportunities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
      toast({ title: 'Opportunity updated!' });
      router.push('/admin/opportunities');
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (data: OpportunityInput) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-5">
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
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
          href="/admin/opportunities"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center">
          <p className="text-brand-muted">Opportunity not found</p>
        </div>
      </div>
    );
  }

  const toDatetimeLocal = (iso: string) => {
    const d = new Date(iso);
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
        href="/admin/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
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
