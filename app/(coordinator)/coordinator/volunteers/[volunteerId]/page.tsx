'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { SkeletonCard } from '../../../../../components/shared/SkeletonCard';
import { api } from '../../../../../lib/api';

export default function VolunteerDetailPage({
  params,
}: {
  params: Promise<{ volunteerId: string }>;
}) {
  const { volunteerId } = use(params);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['volunteer-profile', volunteerId],
    queryFn: () => api.get(`/users/${volunteerId}/profile`).then((r) => r.data),
  });

  if (isLoading)
    return (
      <div className="max-w-2xl">
        <SkeletonCard />
      </div>
    );

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/coordinator/volunteers"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Volunteers
      </Link>

      <div className="bg-white rounded-2xl border border-brand-border p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-heading font-bold text-xl">
              {profile?.name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-brand-text">{profile?.name}</h1>
            <div className="flex items-center gap-1 text-sm text-brand-muted mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{profile?.profile?.totalHours ?? 0} hours served</span>
            </div>
          </div>
        </div>

        {profile?.profile?.bio && (
          <p className="text-sm text-brand-muted leading-relaxed">{profile.profile.bio}</p>
        )}

        {/* Skills */}
        {profile?.profile?.skills?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">
              Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.profile.skills.map((s: string) => (
                <span
                  key={s}
                  className="text-sm bg-brand-bg border border-brand-border text-brand-text px-3 py-1 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {profile?.profile?.interests?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">
              Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.profile.interests.map((i: string) => (
                <span
                  key={i}
                  className="text-sm bg-cyan-50 border border-cyan-200 text-cyan-700 px-3 py-1 rounded-full"
                >
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Availability */}
        {profile?.profile?.availability && (
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">
              Availability
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.profile.availability.days?.map((d: string) => (
                <span
                  key={d}
                  className="text-xs bg-brand-bg border border-brand-border text-brand-text px-2.5 py-1 rounded-full"
                >
                  {d}
                </span>
              ))}
              {profile.profile.availability.timeSlots?.map((t: string) => (
                <span
                  key={t}
                  className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
