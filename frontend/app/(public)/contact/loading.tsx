import { Skeleton } from '@/components/ui/skeleton';

export default function ContactLoading() {
  return (
    <div className="min-h-dvh bg-brand-bg" role="status" aria-busy="true">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:py-12">
        <Skeleton className="h-9 w-48 mb-2" aria-hidden="true" />
        <Skeleton className="h-5 w-80 mb-10" aria-hidden="true" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          <div className="space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" aria-hidden="true" />
                <Skeleton className="h-11 w-full rounded-xl" aria-hidden="true" />
              </div>
            ))}
            <Skeleton className="h-11 w-36 rounded-xl" aria-hidden="true" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-brand-border p-6 bg-brand-surface">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" aria-hidden="true" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" aria-hidden="true" />
                    <Skeleton className="h-4 w-40" aria-hidden="true" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
