import { MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  location: { name?: string; district?: string } | null;
  category: string;
  startDate: string;
}

async function getFeaturedOpportunities(): Promise<Opportunity[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/opportunities/public?limit=3`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    return body.data ?? [];
  } catch (error) {
    Sentry.captureException(error);
    return [];
  }
}

export async function FeaturedOpportunities() {
  const opportunities = await getFeaturedOpportunities();

  if (opportunities.length === 0)
    return (
      <section className="bg-brand-bg/50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-brand-muted">Unable to load opportunities. Please try again later.</p>
        </div>
      </section>
    );

  return (
    <section className="bg-brand-bg/50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-primary">
            Featured
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold text-brand-text sm:text-4xl">
            Volunteer opportunities near you
          </h2>
          <p className="mt-3 text-brand-muted">Real projects. Real impact. Updated daily.</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {opportunities.map((opp, i) => (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.id}`}
              className={`card-hover group rounded-2xl border border-brand-border bg-brand-surface p-6 ${i < 3 ? 'motion-safe:animate-fade-in-up' : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="inline-block rounded-full bg-brand-bg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-primary">
                {opp.category}
              </span>
              <h3 className="mt-3 font-heading font-semibold text-brand-text group-hover:text-brand-primary transition-colors duration-200">
                {opp.title}
              </h3>
              <p className="mt-2 text-sm text-brand-muted line-clamp-2 leading-relaxed">
                {opp.description}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-brand-muted">
                {opp.location?.name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {opp.location.name}
                  </span>
                )}
                {opp.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    {new Date(opp.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/opportunities"
            className="active-bounce inline-flex items-center gap-2 rounded-xl border border-brand-secondary bg-brand-surface px-6 py-3 text-sm font-semibold text-brand-primary transition-colors duration-200 hover:bg-brand-bg focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
          >
            View all opportunities
          </Link>
        </div>
      </div>
    </section>
  );
}
