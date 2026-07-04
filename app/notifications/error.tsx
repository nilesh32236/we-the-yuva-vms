'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function NotificationsError({
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
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center gap-4 px-6">
      <h2 className="font-heading font-bold text-xl text-brand-text">Something went wrong</h2>
      <p className="text-sm text-brand-muted">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
