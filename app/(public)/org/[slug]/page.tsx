import { Building2, ExternalLink, Globe, Mail, Phone, Sparkles } from 'lucide-react';
import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';

const OrgProfileSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  logo: z.string().nullable(),
  website: z.string().nullable(),
  socialMedia: z.record(z.string()).nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  _count: z.object({ opportunities: z.number() }),
});

type OrgProfile = z.infer<typeof OrgProfileSchema>;

async function getOrgBySlug(slug: string): Promise<OrgProfile | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/organizations/public/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const parsed = OrgProfileSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return { title: 'Organization Not Found | WeTheYuva' };
  return {
    title: `${org.name} | WeTheYuva`,
    description: org.description ?? `Learn more about ${org.name} on WeTheYuva.`,
    openGraph: {
      title: `${org.name} | WeTheYuva`,
      description: org.description ?? undefined,
      type: 'profile',
      locale: 'en_IN',
      siteName: 'WeTheYuva',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${org.name} | WeTheYuva`,
      description: org.description ?? undefined,
    },
  };
}

const containerClass = 'mx-auto max-w-6xl px-6';

export default async function OrgProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);

  if (!org) notFound();

  const socialLinks = org.socialMedia
    ? Object.entries(org.socialMedia)
    : [];

  return (
    <>
      <section className="bg-emerald-800 py-20 sm:py-28">
        <div className={`${containerClass} text-center`}>
          <div className="mb-6 flex justify-center">
            {org.logo ? (
              <Image
                src={org.logo}
                alt={`${org.name} logo`}
                width={96}
                height={96}
                className="h-24 w-24 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
                <Building2 className="h-12 w-12 text-white" aria-hidden="true" />
              </div>
            )}
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white leading-tight">
            {org.name}
          </h1>
          {org.description && (
            <p className="text-emerald-100 text-lg sm:text-xl mt-5 max-w-3xl mx-auto leading-relaxed">
              {org.description}
            </p>
          )}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 py-16 sm:py-20">
        <div className={containerClass}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                  About
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {org.description ?? 'No description provided.'}
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-8">
                <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Stats
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white dark:bg-slate-800 p-5 text-center">
                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                      {org._count.opportunities}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Opportunities posted
                    </p>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-800 p-5 text-center">
                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">--</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Events held</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Contact
                </h3>
                <ul className="space-y-3">
                  {org.email && (
                    <li>
                      <a
                        href={`mailto:${org.email}`}
                        className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Mail className="w-5 h-5 shrink-0" aria-hidden="true" />
                        <span className="text-sm break-all">{org.email}</span>
                      </a>
                    </li>
                  )}
                  {org.phone && (
                    <li>
                      <a
                        href={`tel:${org.phone}`}
                        className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Phone className="w-5 h-5 shrink-0" aria-hidden="true" />
                        <span className="text-sm">{org.phone}</span>
                      </a>
                    </li>
                  )}
                  {org.website && (
                    <li>
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Globe className="w-5 h-5 shrink-0" aria-hidden="true" />
                        <span className="text-sm truncate">{org.website}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 ml-auto" aria-hidden="true" />
                      </a>
                    </li>
                  )}
                </ul>
              </div>

              {socialLinks.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white mb-4">
                    Social
                  </h3>
                  <ul className="space-y-3">
                    {socialLinks.map(([platform, url]) => (
                      <li key={platform}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                        >
                          <span className="text-sm capitalize">{platform}</span>
                          <ExternalLink className="w-3 h-3 ml-auto shrink-0" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
