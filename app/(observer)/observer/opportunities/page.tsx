'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { OpportunityCard } from '../../../../components/opportunities/OpportunityCard';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { api } from '../../../../lib/api';

const CATEGORIES = [
  'ALL',
  'EDUCATION',
  'HEALTH',
  'ENVIRONMENT',
  'COMMUNITY',
  'ARTS',
  'SPORTS',
  'TECHNOLOGY',
  'OTHER',
];

interface ObserverOpportunity {
  id: string;
  title: string;
  category: string;
  isRemote: boolean;
  startDate: string;
  endDate: string;
  hoursPerSession: number;
  skills: string[];
  totalSlots: number;
  location?: { name: string; district: string } | null;
  _count?: { applications: number };
  matchScore?: number;
  userApplication?: { status: string } | null;
}

export default function ObserverOpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities', 'observer', search, category, page],
    queryFn: () =>
      api
        .get('/opportunities', {
          params: {
            search: search || undefined,
            category: category === 'ALL' ? undefined : category,
            page,
            limit: 12,
          },
        })
        .then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-heading font-bold text-xl text-brand-text">Opportunities</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 rounded-xl border border-brand-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'ALL' ? 'All categories' : c.charAt(0) + c.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-16 text-brand-muted">
          <p>No opportunities found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data?.map((opp: ObserverOpportunity) => (
              <OpportunityCard key={opp.id} opportunity={opp} showApply={false} />
            ))}
          </div>
          {data?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-brand-border text-sm disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-brand-muted">
                Page {page} of {data.totalPages}
              </span>
              <button type="button"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 rounded-xl border border-brand-border text-sm disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
