'use client';

import { useState } from 'react';
import { MapPin, Calendar, Search } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_LABELS: Record<string, string> = {
  ENVIRONMENT: 'Environment',
  EDUCATION: 'Education',
  HEALTH: 'Health & Wellness',
  COMMUNITY: 'Community',
  TECHNOLOGY: 'Technology',
  ACTIVE_CITIZENSHIP: 'Active Citizenship',
  ARTS: 'Arts & Culture',
  SPORTS: 'Sports',
  OTHER: 'Other',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

interface Opportunity {
  id: string;
  title: string;
  description?: string;
  category: string;
  startDate: string;
  endDate: string;
  location?: { name: string; district: string } | null;
  isRemote: boolean;
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  if (s.toDateString() === e.toDateString()) {
    return s.toLocaleDateString('en-IN', opts);
  }
  return `${s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-IN', opts)}`;
}

export function OpportunitiesClient({ opportunities }: { opportunities: Opportunity[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  const filtered = opportunities.filter((opp) => {
    const matchesSearch = opp.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'ALL' || opp.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-dvh bg-brand-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-2xl text-brand-text md:text-3xl">
            Volunteer Opportunities
          </h1>
          <p className="mt-2 text-sm text-brand-muted max-w-2xl">
            Browse volunteer opportunities across India. Find tree planting drives, teaching
            sessions, community outreach, and more near you.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities…"
            aria-label="Search opportunities"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border text-sm bg-brand-surface text-brand-text placeholder:text-brand-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
          />
        </div>

        {/* Category filter buttons */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none"
          role="tablist"
          aria-label="Filter by category"
        >
          <button
            type="button"
            role="tab"
            aria-selected={category === 'ALL'}
            onClick={() => setCategory('ALL')}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none ${
              category === 'ALL'
                ? 'bg-brand-primary text-white'
                : 'bg-brand-surface text-brand-text border border-brand-border hover:bg-brand-bg'
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={category === cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none ${
                category === cat
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-surface text-brand-text border border-brand-border hover:bg-brand-bg'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-brand-muted mb-4">
          {filtered.length} {filtered.length === 1 ? 'opportunity' : 'opportunities'} found
        </p>

        {/* Card grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-10 h-10 mx-auto mb-3 text-brand-muted/40" aria-hidden="true" />
            <p className="font-medium text-brand-text">No opportunities found</p>
            <p className="text-sm text-brand-muted mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((opp) => (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="group rounded-2xl border border-brand-border p-5 bg-brand-surface flex flex-col gap-3 hover:shadow-md hover:border-brand-primary/30 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
              >
                {/* Category badge */}
                <div>
                  <span className="rounded-full bg-brand-bg px-3 py-1 text-xs font-semibold text-brand-primary">
                    {CATEGORY_LABELS[opp.category] ?? opp.category}
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-heading font-semibold text-brand-text text-base leading-snug line-clamp-2 group-hover:text-brand-primary transition-colors">
                  {opp.title}
                </h2>

                {/* Description */}
                {opp.description && (
                  <p className="text-sm text-brand-muted leading-relaxed line-clamp-2">
                    {opp.description}
                  </p>
                )}

                {/* Meta */}
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-brand-muted">
                  {opp.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                      {opp.location.name}
                    </span>
                  )}
                  {opp.isRemote && !opp.location && (
                    <span className="flex items-center gap-1.5 text-brand-primary">
                      <WifiIcon />
                      Remote
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    {formatDateRange(opp.startDate, opp.endDate)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WifiIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  );
}
