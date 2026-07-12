import { Skeleton } from '../../components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading page content" className="space-y-6 max-w-5xl">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3"
          >
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5">
        <Skeleton className="h-5 w-48 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
