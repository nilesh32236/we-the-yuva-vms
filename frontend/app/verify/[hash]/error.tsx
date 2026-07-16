'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import * as Sentry from '@sentry/nextjs';

export default function VerifyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="font-heading font-bold text-xl text-brand-text">Verification error</h2>
      <p className="text-sm text-brand-muted">Something went wrong during verification. Please try again.</p>
      <Button onClick={reset} variant="primary">
        Try again
      </Button>
    </div>
  );
}
