'use client';

import { useQuery } from '@tanstack/react-query';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

export default function OrgAdminEventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['org-admin-events'],
    queryFn: () => api.get('/events', { params: { limit: 50 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-5 max-w-6xl">
      <h1 className="font-heading font-bold text-xl text-brand-text">Events</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !data?.data?.length ? (
        <div className="text-center py-12 text-brand-muted text-sm">No events found</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="bg-card rounded-2xl border border-brand-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-bg">
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
                  >
                    Event
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden sm:table-cell"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell"
                  >
                    Capacity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {data?.data?.map(
                  (ev: {
                    id: string;
                    title: string;
                    eventDate: string;
                    status: string;
                    capacity: number;
                    _count?: { attendances: number };
                    opportunity?: { title: string };
                  }) => (
                    <tr key={ev.id} className="hover:bg-brand-bg/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-brand-text truncate max-w-[200px]">
                          {ev.title}
                        </p>
                        {ev.opportunity && (
                          <p className="text-xs text-brand-muted truncate">
                            {ev.opportunity.title}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-brand-muted hidden sm:table-cell">
                        {new Date(ev.eventDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[ev.status] ?? ''}`}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brand-muted hidden md:table-cell">
                        {ev._count?.attendances ?? 0} / {ev.capacity}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
