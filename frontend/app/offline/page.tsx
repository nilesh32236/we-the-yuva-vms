'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function OfflinePage() {
  const router = useRouter();
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);
  const [destinationResolved, setDestinationResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'INTENDED_DESTINATION') {
        if (!cancelled) {
          setIntendedDestination(event.data.url ?? null);
          setDestinationResolved(true);
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    const registrationPromise = navigator.serviceWorker?.getRegistration?.();
    if (registrationPromise) {
      registrationPromise.then((registration) => {
        registration?.active?.postMessage({ type: 'GET_INTENDED_DESTINATION' });
      });
    }

    // If the service worker round-trip never answers (e.g. SW cold start), give
    // up after a short grace period so the retry button becomes usable and
    // falls back to the current URL / router.back().
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setDestinationResolved(true);
      }
    }, 2000);

    return () => {
      cancelled = true;
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
      window.clearTimeout(timeout);
    };
  }, []);

  const handleRetry = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const destination =
      intendedDestination ||
      (currentUrl !== '' && currentUrl !== `${window.location.origin}/offline` ? currentUrl : null);
    if (destination) {
      router.push(destination);
    } else {
      router.back();
    }
  };

  return (
    <main
      id="main"
      className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-6">
        <WifiOff className="w-10 h-10 text-brand-primary" />
      </div>

      <h1 className="font-heading font-bold text-2xl text-brand-text mb-2">You&apos;re offline</h1>
      <p className="text-brand-muted text-sm max-w-xs mb-8">
        It looks like you&apos;ve lost your internet connection. Check your connection and try
        again.
      </p>

      <Button
        onClick={handleRetry}
        disabled={!destinationResolved}
        className="px-6 py-3"
      >
        {destinationResolved ? 'Try again' : 'Reconnecting…'}
      </Button>

      <p className="text-brand-muted text-xs mt-8">WeTheYuva VMS · Volunteer Management System</p>
    </main>
  );
}
