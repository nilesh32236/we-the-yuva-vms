import { Skeleton } from '@/components/ui/skeleton';

export default function OpportunitiesLoading() {
  return (
    <div className="min-h-dvh bg-brand-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:py-12">
        {/* Title skeleton */}
        <Skeleton className="h-8 w-64 mb-2" aria-hidden="true" />
        <Skeleton className="h-4 w-96 mb-8" aria-hidden="true" />

        {/* Search skeleton */}
        <Skeleton className="h-10 w-full rounded-xl mb-6" aria-hidden="true" />

        {/* Filter buttons skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" aria-hidden="true" />
          ))}
        </div>

        {/* Results count skeleton */}
        <Skeleton className="h-4 w-32 mb-4" aria-hidden="true" />

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-brand-border p-5 bg-brand-surface space-y-3"
            >
              <Skeleton className="h-5 w-20 rounded-full" aria-hidden="true" />
              <Skeleton className="h-5 w-full" aria-hidden="true" />
              <Skeleton className="h-4 w-4/5" aria-hidden="true" />
              <Skeleton className="h-4 w-3/5" aria-hidden="true" />
              <div className="flex gap-4 pt-1">
                <Skeleton className="h-3 w-24" aria-hidden="true" />
                <Skeleton className="h-3 w-28" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
