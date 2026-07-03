'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

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
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-secondary transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
