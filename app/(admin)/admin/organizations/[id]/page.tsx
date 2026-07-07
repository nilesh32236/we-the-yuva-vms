'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  ShieldAlert,
  Users,
  Briefcase,
  Calendar,
  UserCheck,
  FileSpreadsheet,
  Target,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatsCard } from '@/components/charts/StatsCard';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  SUSPENDED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  ACTIVE: CheckCircle2,
  PENDING: Clock,
  SUSPENDED: ShieldAlert,
};

export default function AdminOrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: org, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-org-detail', id],
    queryFn: () => api.get(`/admin/organizations/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const verifyMut = useMutation({
    mutationFn: (approved: boolean) =>
      api.patch(`/admin/organizations/${id}/verify`, { approved }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-org-detail', id] });
      qc.invalidateQueries({ queryKey: ['admin-orgs'] });
      toast({ title: 'Organization status updated' });
    },
    onError: (err: { normalizedMessage?: string }) => {
      toast({
        title: 'Error',
        description: err.normalizedMessage ?? 'Could not update organization.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-48 bg-brand-bg rounded-lg" />
        <div className="h-40 bg-brand-surface rounded-2xl border border-brand-border" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
            <div key={i} className="h-24 bg-brand-surface rounded-2xl border border-brand-border" />
          ))}
        </div>
        <div className="h-48 bg-brand-surface rounded-2xl border border-brand-border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-40" />
        <p className="font-medium text-brand-text mb-1">Failed to load organization</p>
        <p className="text-sm text-brand-muted mb-6">{(error as Error)?.message ?? 'An unexpected error occurred.'}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary cursor-pointer transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 text-brand-muted mx-auto mb-4 opacity-20" />
        <p className="font-medium text-brand-text">Organization not found</p>
        <Link href="/admin/organizations" className="text-brand-primary text-sm mt-2 inline-block hover:underline">
          Back to organizations
        </Link>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[org.status] ?? ShieldAlert;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/organizations"
        className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organizations
      </Link>

      {/* Org Info Card */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <div className="flex items-start gap-5">
          {org.logo ? (
            <Image
              src={org.logo}
              alt={`${org.name} logo`}
              width={64}
              height={64}
              className="w-16 h-16 rounded-2xl object-cover border border-brand-border flex-shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-brand-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading font-bold text-2xl text-brand-text">{org.name}</h1>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${STATUS_STYLES[org.status] ?? ''}`}
              >
                <StatusIcon className="w-3 h-3" />
                {org.status}
              </span>
            </div>
            <p className="text-brand-muted text-sm mt-1">{org.email ?? 'No email'}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-brand-muted">
              {org.website && (
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors">
                  {org.website}
                </a>
              )}
              {org.address && <span>{org.address}</span>}
              {org.phone && <span>{org.phone}</span>}
              {org.verifiedAt && (
                <span className="font-medium text-green-600 dark:text-green-400">
                  Verified: {new Date(org.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              <span>
                Created: {new Date(org.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard label="Staff" value={org.stats.staffCount} icon={Users} accent="text-blue-500" accentBg="bg-blue-50 dark:bg-blue-950" />
        <StatsCard label="Opportunities" value={org.stats.opportunitiesCount} icon={Briefcase} accent="text-purple-500" accentBg="bg-purple-50 dark:bg-purple-950" />
        <StatsCard label="Active Opps" value={org.stats.activeOpportunitiesCount} icon={Target} accent="text-emerald-500" accentBg="bg-emerald-50 dark:bg-emerald-950" />
        <StatsCard label="Events" value={org.stats.eventsCount} icon={Calendar} accent="text-orange-500" accentBg="bg-orange-50 dark:bg-orange-950" />
        <StatsCard label="Applications" value={org.stats.applicationsCount} icon={FileSpreadsheet} accent="text-pink-500" accentBg="bg-pink-50 dark:bg-pink-950" />
        <StatsCard label="Active Volunteers" value={org.stats.activeVolunteersCount} icon={UserCheck} accent="text-teal-500" accentBg="bg-teal-50 dark:bg-teal-950" />
      </div>

      {/* Documents */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <h2 className="font-heading font-bold text-lg text-brand-text mb-4">Documents</h2>
        {!org.documents?.length ? (
          <p className="text-sm text-brand-muted italic">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {org.documents.map((doc: Document) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border border-brand-border rounded-xl hover:bg-brand-bg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate max-w-[280px]">
                      {doc.fileName}
                    </p>
                    <p className="text-[10px] text-brand-muted uppercase">
                      {doc.type.replace(/_/g, ' ')} &middot;{' '}
                      {new Date(doc.uploadedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-brand-muted hover:text-brand-primary transition-colors"
                  aria-label="Download document"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6">
        <h2 className="font-heading font-bold text-lg text-brand-text mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {org.status === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => verifyMut.mutate(true)}
                disabled={verifyMut.isPending}
                className="px-6 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary cursor-pointer transition-colors disabled:opacity-50 shadow-sm"
              >
                {verifyMut.isPending ? 'Processing...' : 'Approve & Verify'}
              </button>
              <button
                type="button"
                onClick={() => verifyMut.mutate(false)}
                disabled={verifyMut.isPending}
                className="px-6 py-2.5 rounded-xl border border-brand-error text-brand-error text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {org.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => verifyMut.mutate(false)}
              disabled={verifyMut.isPending}
              className="px-6 py-2.5 rounded-xl border border-brand-error text-brand-error text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors disabled:opacity-50"
            >
              {verifyMut.isPending ? 'Processing...' : 'Suspend'}
            </button>
          )}
          {org.status === 'SUSPENDED' && (
            <button
              type="button"
              onClick={() => verifyMut.mutate(true)}
              disabled={verifyMut.isPending}
              className="px-6 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary cursor-pointer transition-colors disabled:opacity-50 shadow-sm"
            >
              {verifyMut.isPending ? 'Processing...' : 'Reactivate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
