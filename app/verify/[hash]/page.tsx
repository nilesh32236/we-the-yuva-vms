'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, CheckCircle2, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api';

interface VerifiedCertificate {
  volunteerName: string;
  levelName: string;
  issuedAt: string;
  valid: boolean;
}

export default function VerifyCertificatePage() {
  const { hash } = useParams<{ hash: string }>();

  const { data, isLoading, isError } = useQuery<VerifiedCertificate>({
    queryKey: ['verify-certificate', hash],
    queryFn: () => api.get(`/certificates/verify/${hash}`).then((r) => r.data),
    enabled: !!hash,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const isValid = data?.valid ?? false;

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div
          className={`rounded-2xl border p-8 text-center space-y-5 ${
            isValid
              ? 'bg-white dark:bg-brand-surface border-emerald-200 dark:border-emerald-800'
              : 'bg-white dark:bg-brand-surface border-red-200 dark:border-red-800'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
              isValid ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
            }`}
          >
            {isValid ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            )}
          </div>

          <div>
            <h1 className="font-heading font-bold text-xl text-brand-text">
              {isValid ? 'Valid Certificate' : 'Certificate Not Found'}
            </h1>
            <p className="text-sm text-brand-muted mt-1">
              {isValid
                ? 'This certificate has been verified and is authentic.'
                : isError
                  ? 'Unable to verify this certificate.'
                  : 'No certificate matches this verification code.'}
            </p>
          </div>

          {isValid && data && (
            <>
              <div className="h-px bg-brand-border" />

              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 bg-brand-bg rounded-xl px-4 py-3">
                  <Award className="w-5 h-5 text-brand-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-brand-muted">Certificate</p>
                    <p className="text-sm font-semibold text-brand-text">{data.levelName}</p>
                  </div>
                </div>

                <div className="bg-brand-bg rounded-xl px-4 py-3">
                  <p className="text-xs text-brand-muted">Issued To</p>
                  <p className="text-sm font-semibold text-brand-text">{data.volunteerName}</p>
                </div>

                <div className="bg-brand-bg rounded-xl px-4 py-3">
                  <p className="text-xs text-brand-muted">Issued On</p>
                  <p className="text-sm font-semibold text-brand-text">
                    {new Date(data.issuedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <p className="text-xs text-brand-muted">
              Verified by{' '}
              <span className="font-semibold text-brand-text">WeTheYuva VMS</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
