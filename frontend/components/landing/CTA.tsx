'use client';

import Link from 'next/link';
import { useInView } from '@/hooks/useInView';

export function CTA() {
  const { ref, inView } = useInView(0.2);

  return (
    <section className="bg-brand-primary py-20 sm:py-28 dark:bg-brand-primary">
      <div
        ref={ref}
        className={`mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8 motion-safe:transition-all motion-safe:duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Start volunteering this week</h2>
        <p className="mx-auto mt-4 max-w-lg text-white/80">
          Create a free account, find an opportunity near you, and show up. That&apos;s it.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="active-bounce rounded-xl bg-brand-surface px-7 py-3 font-semibold text-brand-text transition-colors duration-200 hover:bg-brand-bg"
          >
            Create free account
          </Link>
          <Link
            href="/register"
            className="active-bounce rounded-xl border border-white/40 px-7 py-3 font-semibold text-white transition-colors duration-200 hover:bg-white/10"
          >
            Register organisation
          </Link>
        </div>
      </div>
    </section>
  );
}
