// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Eye, Mail, MapPin, User } from 'lucide-react';
import { api } from '@/lib/api';

export default function ObserverProfilePage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
    staleTime: 60_000,
  });

  const initials =
    user?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-40 text-brand-muted text-sm">Loading…</div>
    );

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden card-hover">
        <div className="h-24 bg-gradient-to-r from-brand-primary to-brand-secondary" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-brand-primary border-4 border-brand-surface flex items-center justify-center shadow-md">
              <span className="text-white font-heading font-bold text-2xl">{initials}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full">
              <Eye className="w-3 h-3" aria-hidden="true" /> Observer
            </div>
          </div>
          <h1 className="font-heading font-bold text-xl text-brand-text">{user?.name}</h1>
          <div className="flex items-center gap-1.5 mt-1 text-brand-muted text-sm">
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{user?.email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: User, label: 'Status', value: user?.status ?? 'Active' },
          { icon: MapPin, label: 'Location', value: user?.location?.name ?? 'Not set' },
          {
            icon: Calendar,
            label: 'Member Since',
            value: new Date(user?.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric',
            }),
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="bg-brand-surface rounded-xl border border-brand-border p-4 text-center card-hover"
          >
            <Icon className="w-4 h-4 text-brand-primary mx-auto mb-1.5" aria-hidden="true" />
            <p className="font-heading font-bold text-base text-brand-text truncate">{value}</p>
            <p className="text-xs text-brand-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 card-hover">
        <h2 className="font-heading font-semibold text-sm text-brand-text mb-3">Account Details</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-brand-muted">Role</dt>
            <dd className="font-medium text-brand-text">Observer</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-muted">Email</dt>
            <dd className="font-medium text-brand-text">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-muted">Location</dt>
            <dd className="font-medium text-brand-text">{user?.location?.name ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-muted">District</dt>
            <dd className="font-medium text-brand-text">{user?.location?.district ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-muted">State</dt>
            <dd className="font-medium text-brand-text">{user?.location?.state ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
