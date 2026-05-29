'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { api, downloadCsv } from '../../../../lib/api';

export default function CoordinatorVolunteersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['coordinator-volunteers', search, page],
    queryFn: () =>
      api
        .get('/coordinators/me/volunteers', {
          params: { search: search || undefined, page, limit: 20 },
        })
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const handleExport = () => {
    downloadCsv('/coordinators/me/volunteers/export', 'volunteers.csv');
  };

  return (
      <div className="space-y-5 max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading font-bold text-xl text-brand-text">Volunteers</h1>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 border border-brand-border text-brand-text text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-brand-bg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search volunteers…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-12 text-center">
            <p className="font-medium text-brand-text">No volunteers yet</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-bg">
                    <th
                      scope="col"
                      className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden sm:table-cell"
                    >
                      Skills
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
                    >
                      Hours
                    </th>
                    <th scope="col" className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {data?.data?.map(
                    (v: {
                      id: string;
                      name: string;
                      profile?: { skills: string[]; totalHours: number };
                    }) => (
                      <tr key={v.id} className="hover:bg-brand-bg/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-brand-text">{v.name}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {v.profile?.skills?.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="text-xs bg-brand-bg border border-brand-border text-brand-text px-2 py-0.5 rounded-full"
                              >
                                {s}
                              </span>
                            ))}
                            {(v.profile?.skills?.length ?? 0) > 3 && (
                              <span className="text-xs text-brand-muted">
                                +{(v.profile?.skills?.length ?? 0) - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-brand-muted">{v.profile?.totalHours ?? 0}h</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/coordinator/volunteers/${v.id}`}
                            className="text-xs text-brand-primary hover:underline cursor-pointer"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            {data?.meta?.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-brand-border text-sm font-medium disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-brand-muted">
                  Page {page} of {data.meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  disabled={page === data.meta.totalPages}
                  className="px-4 py-2 rounded-xl border border-brand-border text-sm font-medium disabled:opacity-40 hover:bg-brand-bg cursor-pointer transition-colors"
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
