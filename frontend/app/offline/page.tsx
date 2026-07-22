'use client';

import { WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    const swDestination = sessionStorage.getItem('offline-intended-destination');
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const destination = swDestination || (currentUrl !== '' && currentUrl !== `${window.location.origin}/offline` ? currentUrl : null);
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

      <button
        type="button"
        onClick={handleRetry}
        className="inline-flex items-center gap-2 bg-brand-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer"
      >
        Try again
      </button>

      <p className="text-brand-muted text-xs mt-8">WeTheYuva VMS · Volunteer Management System</p>
    </main>
  );
}
