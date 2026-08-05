'use client';

import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { haptic } from '@/lib/haptic';

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const onlineTimerRef = useRef<number | undefined>(undefined);
  const consecutiveFailuresRef = useRef(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      haptic.success();
      setIsOnline(true);
      setShowOnlineToast(true);

      window.clearTimeout(onlineTimerRef.current);
      onlineTimerRef.current = window.setTimeout(() => {
        setShowOnlineToast(false);
      }, 3000);
    };

    const handleOffline = () => {
      haptic.error();
      setIsOnline(false);
      setShowOnlineToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearTimeout(onlineTimerRef.current);
    };
  }, []);

  // Periodic connectivity probe. navigator.onLine only reflects the browser's
  // own online/offline events, so a real request is needed to detect failures
  // those events miss (captive portals, Wi-Fi without a route, dead backend).
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      const controller = new AbortController();
      // Timeout matches the 10s interval so a slow-but-alive backend (e.g. an
      // HF Spaces cold start) is not flagged offline; only two consecutive
      // failures downgrade to offline to avoid transient false negatives.
      const timeoutId = window.setTimeout(() => controller.abort(), 10000);
      try {
        await fetch('/api/v1/health', { cache: 'no-store', signal: controller.signal });
        if (!cancelled) {
          consecutiveFailuresRef.current = 0;
          setIsOnline(true);
        }
      } catch {
        if (!cancelled && ++consecutiveFailuresRef.current >= 2) {
          setIsOnline(false);
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    probe();
    const interval = window.setInterval(probe, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  // Don't render anything during initial mount
  if (isOnline === null) return null;

  return (
    <div
      className="fixed top-[calc(env(safe-area-inset-top)+4.5rem)] left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-xs px-4"
      aria-live="polite"
      role="status"
    >
      {/* Offline Alert */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 bg-brand-surface/95 backdrop-blur-md text-brand-error px-4 py-3 rounded-2xl shadow-xl border border-brand-error/20 animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-brand-error/10 flex items-center justify-center flex-shrink-0 animate-pulse">
            <WifiOff className="w-4 h-4 text-brand-error" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold font-heading">Connection Lost</p>
            <p className="text-[10px] text-brand-error">Running in offline cache mode</p>
          </div>
        </div>
      )}

      {/* Reconnected Confirmation */}
      {isOnline && showOnlineToast && (
        <div className="flex items-center gap-2.5 bg-brand-surface/95 backdrop-blur-md text-brand-primary px-4 py-3 rounded-2xl shadow-xl border border-brand-primary/20 animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <Wifi className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold font-heading">Back Online</p>
            <p className="text-[10px] text-brand-primary">Reconnected successfully</p>
          </div>
        </div>
      )}
    </div>
  );
}
