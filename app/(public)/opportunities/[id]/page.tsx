import { ArrowLeft, Briefcase, Calendar, Clock, MapPin, Users, Wifi } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  hoursPerSession: number;
  totalSlots: number;
  isRemote: boolean;
  location?: { name: string; district: string } | null;
  skills: string[];
  createdBy?: { name: string };
  _count?: { applications: number };
  status?: string;
}

async function getOpportunity(id: string): Promise<Opportunity | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/opportunities/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.data ?? body ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const opp = await getOpportunity(id);

  if (!opp) {
    return { title: 'Opportunity Not Found | WeTheYuva' };
  }

  return {
    title: `${opp.title} | WeTheYuva`,
    description: opp.description?.slice(0, 160),
    openGraph: {
      title: `${opp.title} | WeTheYuva`,
      description: opp.description?.slice(0, 160),
      type: 'article',
      locale: 'en_IN',
      siteName: 'WeTheYuva',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${opp.title} | WeTheYuva`,
      description: opp.description?.slice(0, 160),
    },
  };
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opp = await getOpportunity(id);

  if (!opp) {
    notFound();
  }

  const slotsLeft = opp.totalSlots - (opp._count?.applications ?? 0);
  const isFull = slotsLeft <= 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VolunteerAction',
    name: opp.title,
    description: opp.description,
    startDate: opp.startDate,
    endDate: opp.endDate,
    url: `${process.env.NEXT_PUBLIC_URL || 'https://wetheyuva.org'}/opportunities/${id}`,
  };

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning>
        {JSON.stringify(jsonLd)}
      </script>
      <div className="min-h-dvh bg-brand-bg">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 lg:py-12">
          {/* Back link */}
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors mb-6 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none rounded"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to opportunities
          </Link>

          {/* Detail card */}
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6 text-brand-primary" aria-hidden="true" />
              </div>
              <span className="rounded-full bg-brand-bg px-3 py-1 text-xs font-semibold text-brand-primary shrink-0">
                {CATEGORY_LABELS[opp.category] ?? opp.category}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-heading font-bold text-2xl text-brand-text md:text-3xl">
                {opp.title}
              </h1>
              {opp.createdBy?.name && (
                <p className="text-sm text-brand-muted mt-1">by {opp.createdBy.name}</p>
              )}
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2.5 text-brand-muted">
                <Calendar className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
                <span>
                  {new Date(opp.startDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {' – '}
                  {new Date(opp.endDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-brand-muted">
                <Clock className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
                <span>{opp.hoursPerSession}h per session</span>
              </div>
              <div className="flex items-center gap-2.5 text-brand-muted">
                <Users className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
                <span>{isFull ? 'Full' : `${slotsLeft} of ${opp.totalSlots} slots left`}</span>
              </div>
              <div className="flex items-center gap-2.5 text-brand-muted">
                {opp.isRemote ? (
                  <>
                    <Wifi className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
                    <span>Remote</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
                    <span>{opp.location?.name ?? 'On-site'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Apply CTA */}
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block bg-brand-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-secondary transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
              >
                Apply now
              </Link>
              <p className="text-xs text-brand-muted mt-2">
                You will be redirected to login first.
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 md:p-8 mt-5 space-y-3">
            <h2 className="font-heading font-semibold text-sm text-brand-text">
              About this opportunity
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed whitespace-pre-line">
              {opp.description}
            </p>
          </div>

          {/* Skills */}
          {opp.skills?.length > 0 && (
            <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 md:p-8 mt-5 space-y-3">
              <h2 className="font-heading font-semibold text-sm text-brand-text">Skills needed</h2>
              <div className="flex flex-wrap gap-2">
                {opp.skills.map((s: string) => (
                  <span
                    key={s}
                    className="text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
