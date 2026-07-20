// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { haptic } from '@/lib/haptic';

export function AppUpdatePrompt() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Grab the active Service Worker registration
    navigator.serviceWorker.ready
      .then((reg) => {
        setRegistration(reg);

        // 1. If there's already a waiting worker, prompt immediately
        if (reg.waiting) {
          setUpdateAvailable(true);
        }

        // 2. Listen for new workers being installed
        const handleUpdateFound = () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                haptic.success();
                setUpdateAvailable(true);
              }
            });
          }
        };

        reg.addEventListener('updatefound', handleUpdateFound);
      })
      .catch(() => {});

    // 3. Listen for controlling worker change (after skipWaiting is invoked)
    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    haptic.medium();
    if (registration?.waiting) {
      try {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } catch {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    haptic.light();
    setDismissed(true);
  };

  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 pointer-events-none w-full max-w-sm px-4">
      <div className="flex items-start gap-3 bg-brand-surface/95 backdrop-blur-md text-brand-text p-4 rounded-2xl shadow-2xl border border-brand-border animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
        <div className="w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-brand-primary" />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs font-bold font-heading text-brand-text">New Version Available</p>
          <p className="text-[10px] text-brand-muted mt-0.5">
            An updated version of WeTheYuva VMS has been downloaded. Reload to apply changes!
          </p>
          <button
            type="button"
            onClick={handleUpdate}
            className="mt-2.5 flex items-center gap-1.5 bg-brand-primary hover:bg-brand-secondary active:scale-95 text-white font-heading font-bold text-[10px] px-3.5 py-3 rounded-lg cursor-pointer transition-colors duration-100 min-h-[44px] focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-3 h-3 animate-spin-slow" />
            Reload & Update
          </button>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-brand-muted hover:bg-brand-bg transition-colors cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
