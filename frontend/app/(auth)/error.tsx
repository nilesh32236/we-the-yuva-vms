'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function AuthError({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="font-heading font-bold text-xl text-brand-text">Something went wrong</h2>
      <p className="text-sm text-brand-muted">An unexpected error occurred. Please try again.</p>
      <Button onClick={reset} variant="primary">
        Try again
      </Button>
    </div>
  );
}
