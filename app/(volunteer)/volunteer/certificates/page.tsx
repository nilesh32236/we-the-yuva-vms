'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, ExternalLink, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';

interface Certificate {
  id: string;
  levelName: string;
  issuedAt: string;
  verificationHash: string;
  status: string;
}

export default function CertificatesPage() {
  const { data, isLoading } = useQuery<{ data: Certificate[] }>({
    queryKey: ['certificates'],
    queryFn: () => api.get('/certificates').then((r) => r.data),
    staleTime: 30_000,
  });

  const certificates = data?.data ?? [];

  async function handleShare(cert: Certificate) {
    haptic.medium();
    const url = `${window.location.origin}/verify/${cert.verificationHash}`;
    if (navigator.share) {
      await navigator.share({ title: `${cert.levelName} Certificate`, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading font-bold text-xl text-brand-text">My Certificates</h1>
        <p className="text-brand-muted text-sm mt-1">
          View and share certificates earned through your volunteer journey.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-16 bg-brand-surface rounded-2xl border border-brand-border">
          <Award className="w-12 h-12 mx-auto mb-3 text-brand-muted opacity-50" />
          <h3 className="text-sm font-semibold text-brand-text">No certificates yet</h3>
          <p className="text-xs text-brand-muted mt-1">
            Complete volunteer milestones to earn certificates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-4 hover:shadow-md hover:border-brand-primary/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-semibold text-sm text-brand-text truncate">
                    {cert.levelName}
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Issued{' '}
                    {new Date(cert.issuedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="bg-brand-bg rounded-xl px-3 py-2">
                <p className="text-[10px] text-brand-muted font-medium uppercase tracking-wider">
                  Verification Hash
                </p>
                <p className="text-xs font-mono text-brand-text truncate">
                  {cert.verificationHash.slice(0, 16)}...
                </p>
              </div>

              <div className="flex gap-2">
                <Link href={`/volunteer/certificates/${cert.id}`} className="flex-1">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => haptic.light()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => handleShare(cert)}>
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
