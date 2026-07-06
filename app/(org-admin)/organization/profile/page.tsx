'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function OrgAdminProfilePage() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-5 max-w-3xl">
      <Link
        href="/organization/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text active-bounce transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Dashboard
      </Link>

      <h1 className="font-heading font-bold text-xl text-brand-text">My Profile</h1>

      {isLoading ? (
        <SkeletonCard />
      ) : (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 space-y-5 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center shadow-sm">
              <span className="text-white font-heading font-bold text-xl">
                {user?.name
                  ?.split(' ')
                  ?.map((n: string) => n[0])
                  ?.join('')
                  ?.toUpperCase()
                  ?.slice(0, 2) ?? '?'}
              </span>
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-brand-text">
                {profile?.name ?? user?.name ?? '—'}
              </h2>
              <span className="inline-block mt-1 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                Org Admin
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-brand-muted" aria-hidden="true" />
              <span className="text-brand-text">{profile?.email ?? user?.email ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="w-4 h-4 text-brand-muted" aria-hidden="true" />
              <span className="text-brand-text">
                {profile?.organization?.name ?? 'Organization admin'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-brand-muted" aria-hidden="true" />
              <span className="text-brand-text">{profile?.phone ?? '—'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
