import { Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  date?: string;
}

async function getFeaturedOpportunities(): Promise<Opportunity[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/opportunities?limit=3`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    return body.data ?? [];
  } catch {
    return [];
  }
}

export async function FeaturedOpportunities() {
  const opportunities = await getFeaturedOpportunities();

  if (opportunities.length === 0) return null;

  return (
    <section className="bg-emerald-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-emerald-600">
            Featured
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
            Volunteer opportunities near you
          </h2>
          <p className="mt-3 text-slate-500">Real projects. Real impact. Updated daily.</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {opportunities.map((opp) => (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-shadow duration-200 hover:shadow-lg hover:border-emerald-200 hover:shadow-emerald-500/5"
            >
              <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                {opp.category}
              </span>
              <h3 className="mt-3 font-heading font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors duration-200">
                {opp.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                {opp.description}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                {opp.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {opp.location}
                  </span>
                )}
                {opp.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    {new Date(opp.date).toLocaleDateString('en-IN', {
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
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors duration-200 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
          >
            View all opportunities
          </Link>
        </div>
      </div>
    </section>
  );
}
