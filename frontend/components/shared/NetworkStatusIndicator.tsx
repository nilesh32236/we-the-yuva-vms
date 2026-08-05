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
      // Reset the probe's failure counter so a probe success that follows the
      // browser 'online' event is not mistaken for a separate recovery (which
      // would double-show the 'Back Online' toast).
      consecutiveFailuresRef.current = 0;

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
    let inFlight = false;
    let timeoutId: number | undefined;

    const probe = async () => {
      // Skip while a probe is still pending so a slow-but-alive backend is not
      // double-counted toward the failure threshold, and skip when the browser
      // already reports offline (the 'online'/'offline' events own that state)
      // or the tab is hidden/backgrounded (no user-facing benefit, and open
      // tabs multiply backend traffic).
      if (cancelled || inFlight) return;
      if (!navigator.onLine || document.visibilityState !== 'visible') return;

      inFlight = true;
      const controller = new AbortController();
      // Timeout matches the 10s interval so a slow-but-alive backend (e.g. an
      // HF Spaces cold start) is not flagged offline; only two consecutive
      // failures downgrade to offline to avoid transient false negatives.
      timeoutId = window.setTimeout(() => controller.abort(), 10000);
      try {
        const res = await fetch('/api/v1/health', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!cancelled) {
          if (res.ok) {
            // fetch() resolves for HTTP error statuses too, so only a 2xx
            // counts as healthy — a live proxy that returns 5xx (e.g. an HF
            // Spaces 502 during a restart) is offline as far as the app is
            // concerned. Recovery detected by the probe alone surfaces the
            // same 'Back Online' feedback as the browser 'online' event, but
            // only when the offline banner was actually shown (two consecutive
            // failures) — a single transient failure followed by success is
            // not a reconnection worth a toast.
            const recovered = consecutiveFailuresRef.current >= 2;
            consecutiveFailuresRef.current = 0;
            setIsOnline(true);
            if (recovered) {
              haptic.success();
              setShowOnlineToast(true);
              window.clearTimeout(onlineTimerRef.current);
              onlineTimerRef.current = window.setTimeout(() => {
                setShowOnlineToast(false);
              }, 3000);
            }
          } else if (++consecutiveFailuresRef.current >= 2) {
            setIsOnline(false);
          }
        }
      } catch {
        if (!cancelled && ++consecutiveFailuresRef.current >= 2) {
          setIsOnline(false);
        }
      } finally {
        inFlight = false;
        window.clearTimeout(timeoutId);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        probe();
      }
    };

    probe();
    const interval = window.setInterval(probe, 10000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
