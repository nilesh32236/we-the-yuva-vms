'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Award, Copy, Download, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';
import { useToast } from '@/hooks/use-toast';

interface CertificateDetail {
  id: string;
  levelName: string;
  issuedAt: string;
  verificationHash: string;
  status: string;
  volunteerName?: string;
}

export default function CertificateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ data: CertificateDetail }>({
    queryKey: ['certificate', id],
    queryFn: () => api.get(`/certificates/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const cert = data?.data;

  async function handleShare() {
    if (!cert) return;
    haptic.medium();
    const url = `${window.location.origin}/verify/${cert.verificationHash}`;
    if (navigator.share) {
      await navigator.share({ title: `${cert.levelName} Certificate`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: 'Certificate link copied to clipboard' });
    }
  }

  async function handleCopyVerifyLink() {
    if (!cert) return;
    haptic.light();
    const url = `${window.location.origin}/verify/${cert.verificationHash}`;
    await navigator.clipboard.writeText(url);
    toast({ title: 'Copied!', description: 'Verification link copied to clipboard' });
  }

  function handleDownload() {
    haptic.medium();
    window.open(`/api/v1/certificates/${id}/view?print=1`, '_blank');
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="text-center py-16">
        <p className="text-brand-muted text-sm">Certificate not found</p>
        <Link href="/volunteer/certificates">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="w-4 h-4" /> Back to Certificates
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/volunteer/certificates"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
        onClick={() => haptic.light()}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Certificates
      </Link>

      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="aspect-[1.414/1] w-full bg-brand-bg">
          <iframe
            src={`/api/v1/certificates/${id}/view`}
            className="w-full h-full border-0"
            title="Certificate Preview"
          />
        </div>
      </div>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h1 className="font-heading font-semibold text-lg text-brand-text">{cert.levelName}</h1>
            <p className="text-sm text-brand-muted mt-0.5">
              Issued{' '}
              {new Date(cert.issuedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-brand-bg rounded-xl px-4 py-3">
            <p className="text-xs text-brand-muted font-medium uppercase tracking-wider">
              Status
            </p>
            <span className="text-sm font-semibold text-brand-primary">
              {cert.status}
            </span>
          </div>
          <div className="bg-brand-bg rounded-xl px-4 py-3">
            <p className="text-xs text-brand-muted font-medium uppercase tracking-wider">
              Verification Hash
            </p>
            <p className="text-xs font-mono text-brand-text truncate">{cert.verificationHash}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" /> Download as PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyVerifyLink}>
            <Copy className="w-4 h-4" /> Verify Certificate
          </Button>
        </div>
      </div>
    </div>
  );
}
