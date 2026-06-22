// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useEffect, useState } from 'react';
import { Bell, Download, Sparkles, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { haptic } from '@/lib/haptic';

export function PWAInstallBanner() {
  const { isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user already dismissed it in this session
    const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  if (!mounted || !isInstallable || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    haptic.light();
    setDismissed(true);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleInstall = async () => {
    haptic.medium();
    const success = await install();
    if (success) {
      setDismissed(true);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-5 md:p-6 shadow-xl border border-emerald-700/50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Background patterns */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/20 blur-xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-teal-500/20 blur-xl pointer-events-none" />

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white/80 active:scale-90"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-300">
              Get the Native Experience
            </span>
          </div>

          <h2 className="font-heading font-bold text-lg md:text-xl leading-tight">
            Install WeTheYuva VMS App
          </h2>
          <p className="text-emerald-100/80 text-xs md:text-sm">
            Add WeTheYuva to your home screen for quick access, offline features, and push
            notifications.
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="flex items-center gap-2 text-xs text-emerald-100/90">
              <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3 h-3 text-emerald-300" />
              </div>
              <span>One-tap Launch</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-100/90">
              <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <WifiOff className="w-3 h-3 text-emerald-300" />
              </div>
              <span>Offline Mode</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-100/90">
              <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-3 h-3 text-emerald-300" />
              </div>
              <span>Real-time Alerts</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          className="flex items-center justify-center gap-2.5 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-emerald-950 font-heading font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-900/40 transition-all duration-150 cursor-pointer w-full md:w-auto flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
      </div>
    </div>
  );
}
