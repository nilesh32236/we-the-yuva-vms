'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Edit2,
  Globe,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  type LucideIcon,
} from 'lucide-react';
import NextLink from 'next/link';
import { useState } from 'react';
import OrgProfileForm from '@/components/org/OrgProfileForm';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function OrgAdminOrgProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  const orgId = user?.organizationId;

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => api.get(`/organizations/${orgId}`).then((r) => r.data),
    enabled: !!orgId,
    staleTime: 30_000,
  });

  if (!orgId) {
    return (
      <div className="space-y-5 max-w-3xl">
        <NextLink
          href="/organization/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text active-bounce transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Dashboard
        </NextLink>
        <h1 className="font-heading font-bold text-xl text-brand-text">Organization Profile</h1>
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 text-center space-y-3">
          <Building2 className="w-10 h-10 text-brand-muted mx-auto" />
          <p className="text-brand-muted text-sm">
            You are not associated with any organization yet.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <NextLink
          href="/organization/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text active-bounce transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Dashboard
        </NextLink>
        <h1 className="font-heading font-bold text-xl text-brand-text">Organization Profile</h1>
        <SkeletonCard />
      </div>
    );
  }

  if (!org) return null;

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: LucideIcon;
    label: string;
    value?: string | null;
  }) => (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="w-4 h-4 text-brand-muted mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        <p className="text-xs text-brand-muted">{label}</p>
        <p className="text-brand-text">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <NextLink
        href="/organization/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text active-bounce transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Dashboard
      </NextLink>

      <h1 className="font-heading font-bold text-xl text-brand-text">Organization Profile</h1>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {org.logo ? (
              <img
                src={org.logo}
                alt={`${org.name} logo`}
                className="w-16 h-16 rounded-2xl object-cover border border-brand-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-brand-primary" />
              </div>
            )}
            <div>
              <h2 className="font-heading font-bold text-lg text-brand-text">{org.name}</h2>
              <span className="inline-block mt-1 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                {org.status}
              </span>
            </div>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:bg-brand-bg px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {org.description && (
          <p className="text-sm text-brand-muted border-t border-brand-border pt-4">
            {org.description}
          </p>
        )}
      </div>

      {editing ? (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
          <OrgProfileForm org={org} onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 space-y-4">
          <InfoRow icon={Mail} label="Email" value={org.email} />
          <InfoRow icon={Phone} label="Phone" value={org.phone} />
          <InfoRow icon={Globe} label="Website" value={org.website} />
          <div className="flex items-start gap-3 text-sm">
            <LinkIcon className="w-4 h-4 text-brand-muted mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs text-brand-muted">Public URL</p>
              {org.slug ? (
                <a
                  href={`https://wetheyuva.org/org/${org.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary hover:underline"
                >
                  wetheyuva.org/org/{org.slug}
                </a>
              ) : (
                <p className="text-brand-text">—</p>
              )}
            </div>
          </div>
          <InfoRow icon={MapPin} label="Address" value={org.address} />
        </div>
      )}
    </div>
  );
}
