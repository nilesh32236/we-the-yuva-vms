'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import Pagination from '@/components/shared/Pagination';
import { useState } from 'react';
import { OrganizationTable } from '@/components/admin/OrganizationTable';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { api } from '../../../../lib/api';

const STATUSES = ['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'];

export default function AdminOrganizationsPage() {
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orgs', status, page],
    queryFn: () =>
      api
        .get('/admin/organizations', {
          params: {
            status: status === 'ALL' ? undefined : status,
            page,
            limit: 20,
          },
        })
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const handleStatusChange = (s: string) => { setStatus(s); setPage(1); };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-brand-text">Organizations</h1>
        <div className="hidden sm:flex items-center gap-2 bg-brand-bg px-4 py-2 rounded-xl border border-brand-border">
          <Building2 className="w-4 h-4 text-brand-primary" />
          <span className="text-xs font-bold text-brand-text">{data?.total ?? 0} Total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
            Status:
          </span>
          <div className="flex bg-brand-surface border border-brand-border p-1 rounded-xl shadow-sm">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(s)}
                aria-pressed={status === s}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer
                  ${status === s ? 'bg-brand-primary text-white shadow-md' : 'text-brand-muted hover:text-brand-text'}`}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div role="status" aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !data?.orgs?.length ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center">
          <Building2 className="w-12 h-12 text-brand-muted mx-auto mb-4 opacity-20" />
          <p className="font-medium text-brand-text">No organizations found</p>
          <p className="text-sm text-brand-muted mt-1">Try changing your filters.</p>
        </div>
      ) : (
        <>
          <OrganizationTable orgs={data.orgs} />

          <Pagination page={page} totalPages={data.totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}
