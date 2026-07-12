'use client';

import { useEffect, useState } from 'react';
import { BellRing, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { haptic } from '@/lib/haptic';

export function PushSubscriber() {
  const { user } = useAuth();
  const { permission, subscribe } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Auto-subscribe in background if permission is already granted
  useEffect(() => {
    if (!mounted || !user || permission !== 'granted') return;

    // Fire silent background subscription to refresh registration on backend
    subscribe().catch(() => {});
  }, [user, permission, mounted, subscribe]);

  // 2. Handle soft permission prompt presentation
  useEffect(() => {
    if (!mounted || !user || permission !== 'default') {
      setShowPrompt(false);
      return;
    }

    // Delay prompt presentation slightly for better user onboarding flow
    const timer = setTimeout(() => {
      const isDismissed = sessionStorage.getItem('push-prompt-dismissed') === 'true';
      if (!isDismissed) {
        setShowPrompt(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, permission, mounted]);

  if (!mounted || !user || !showPrompt) {
    return null;
  }

  const handleDismiss = () => {
    haptic.light();
    setShowPrompt(false);
    sessionStorage.setItem('push-prompt-dismissed', 'true');
  };

  const handleSubscribe = async () => {
    haptic.medium();
    try {
      await subscribe();
      setShowPrompt(false);
    } catch {
      // Error handled by the hook
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40 pointer-events-none w-full max-w-sm px-4">
      <div className="flex flex-col gap-3 bg-brand-surface/98 backdrop-blur-md text-brand-text p-4 md:p-5 rounded-2xl shadow-2xl border border-brand-border animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-brand-bg text-brand-primary">
              <BellRing className="w-4 h-4 animate-bounce" />
            </span>
            <span className="text-xs font-bold font-heading text-brand-text">Enable Updates</span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-muted hover:bg-brand-bg transition-colors cursor-pointer active:scale-90"
            aria-label="Not now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-brand-text leading-snug">
            Get instant alerts on volunteering matches!
          </h3>
          <p className="text-[10px] text-brand-muted leading-relaxed">
            Receive real-time notifications for event confirmations, organizer feedback, and new
            opportunities that match your skills.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1.5">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-2 text-[10px] font-semibold text-brand-muted hover:text-brand-text bg-brand-bg/50 hover:bg-brand-bg rounded-xl transition-colors duration-100 cursor-pointer active:scale-95 text-center"
          >
            Not Now
          </button>

          <button
            type="button"
            onClick={handleSubscribe}
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand-primary hover:bg-brand-secondary active:scale-95 text-white font-heading font-bold text-[10px] py-2 rounded-xl shadow-md shadow-emerald-700/20 transition-colors duration-100 cursor-pointer text-center"
          >
            <Sparkles className="w-3 h-3 text-emerald-200" />
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}
