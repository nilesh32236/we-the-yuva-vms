'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-brand-bg flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/50">
          <svg
            className="w-8 h-8 text-red-500 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-label="Error"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="font-heading font-bold text-xl text-brand-text">Something went wrong</h1>
        <p className="text-brand-muted text-sm">An unexpected error occurred. Please try again.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
