// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { haptic } from '@/lib/haptic';

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const onlineTimerRef = useRef<number | undefined>(undefined);

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

  // Periodic connectivity check (browser online/offline events can be unreliable)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(navigator.onLine);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Don't render anything during initial mount
  if (isOnline === null) return null;

  return (
    <div
      className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-xs px-4"
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
