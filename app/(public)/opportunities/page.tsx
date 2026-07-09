import type { Metadata } from 'next';
import { z } from 'zod';
import { OpportunitiesClient } from './client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const PublicOpportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  isRemote: z.boolean(),
  startDate: z.string(),
  endDate: z.string(),
  hoursPerSession: z.number(),
  skills: z.array(z.string()),
  totalSlots: z.number(),
  location: z.object({ name: z.string(), district: z.string() }).nullable().optional(),
  _count: z.object({ applications: z.number() }).optional(),
  matchScore: z.number().optional(),
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Volunteer Opportunities | WeTheYuva',
    description:
      'Browse volunteer opportunities across India. Find tree planting drives, teaching sessions, community outreach, and more near you.',
    openGraph: {
      title: 'Volunteer Opportunities | WeTheYuva',
      description:
        'Browse volunteer opportunities across India. Find tree planting drives, teaching sessions, and community outreach near you.',
      type: 'website',
      locale: 'en_IN',
      siteName: 'WeTheYuva',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Volunteer Opportunities | WeTheYuva',
      description: 'Browse volunteer opportunities across India.',
    },
  };
}

async function getOpportunities() {
  try {
    const res = await fetch(`${API_URL}/api/v1/opportunities/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    const raw = body.data ?? [];
    const parsed = z.array(PublicOpportunitySchema).safeParse(raw);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Volunteer Opportunities',
    description: 'Browse volunteer opportunities across India.',
    url: `${process.env.NEXT_PUBLIC_URL || 'https://wetheyuva.org'}/opportunities`,
  };

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning>
        {JSON.stringify(jsonLd)}
      </script>
      <OpportunitiesClient opportunities={opportunities} />
    </>
  );
}
