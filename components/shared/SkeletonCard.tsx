import { Skeleton } from '../ui/skeleton';

export function SkeletonCard() {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-brand-border p-6 space-y-4"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-6 w-1/3" aria-hidden="true" />
      <Skeleton className="h-4 w-full" aria-hidden="true" />
      <Skeleton className="h-4 w-4/5" aria-hidden="true" />
      <Skeleton className="h-4 w-3/5" aria-hidden="true" />
    </div>
  );
}
