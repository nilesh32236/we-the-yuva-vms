'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import * as Sentry from '@sentry/nextjs';

export default function AdminError({
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
      <h1 className="font-heading font-bold text-xl text-brand-text">Something went wrong</h1>
      <p className="text-sm text-brand-muted">An unexpected error occurred.</p>
      <Button onClick={reset} variant="primary">
        Try again
      </Button>
    </div>
  );
}
