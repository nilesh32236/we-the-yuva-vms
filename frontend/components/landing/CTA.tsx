import Link from 'next/link';
import { Reveal } from '@/components/shared/Reveal';

export function CTA() {
  return (
    <section className="bg-brand-primary py-20 sm:py-28 dark:bg-brand-primary">
      <Reveal className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8" threshold={0.2}>
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Start volunteering this week</h2>
        <p className="mx-auto mt-4 max-w-lg text-white/80">
          Create a free account, find an opportunity near you, and show up. That&apos;s it.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="active-bounce rounded-xl bg-brand-surface px-7 py-3 font-semibold text-brand-text transition-colors duration-200 hover:bg-brand-bg focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            Create free account
          </Link>
          <Link
            href="/register"
            className="active-bounce rounded-xl border border-white/40 px-7 py-3 font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            Register organisation
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
