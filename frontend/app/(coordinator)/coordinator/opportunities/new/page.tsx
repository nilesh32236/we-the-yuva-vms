'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { OpportunityInput } from '@/lib/shared';
import { OpportunityForm } from '../../../../../components/opportunities/OpportunityForm';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';

export default function NewOpportunityPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (data: OpportunityInput) => {
    await api.post('/opportunities', data);
    toast({ title: 'Opportunity created!' });
    router.push('/coordinator/opportunities');
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
        <h1 className="font-heading font-bold text-xl text-brand-text mb-5">Create Opportunity</h1>
        <OpportunityForm onSubmit={handleSubmit} submitLabel="Create Opportunity" />
      </div>
    </div>
  );
}
