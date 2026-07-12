import { Skeleton } from '@/components/ui/skeleton';

function AccordionSkeleton() {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 [&:not(:last-child)]:mb-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}

export default function FAQLoading() {
  return (
    <div className="min-h-dvh bg-brand-bg" role="status" aria-busy="true">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center mb-12">
          <Skeleton className="h-9 w-72 mx-auto mb-3" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>

        <div className="space-y-10">
          {[0, 1, 2, 3].map((i) => (
            <div key={`section-${i}`}>
              <Skeleton className="h-6 w-40 mb-4" />
              {[0, 1, 2].map((j) => (
                <AccordionSkeleton key={`acc-${i}-${j}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
