'use client';

import { useEffect, useRef, useState } from 'react';
import { BellRing, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { haptic } from '@/lib/haptic';
import { useToast } from '@/hooks/use-toast';
import { captureApiError } from '@/lib/sentry';
import { Button } from '@/components/ui/Button';

export function PushSubscriber() {
  const { user } = useAuth();
  const { permission, subscribe, error } = usePushNotifications();
  const { toast } = useToast();
  const [showPrompt, setShowPrompt] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const manualSubscribeRef = useRef(false);
  const userId = user?.id;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!userId) return;
    manualSubscribeRef.current = false;
  }, [userId]);

  // 1. Auto-subscribe in background if permission is already granted
  useEffect(() => {
    if (!mounted || !user || permission !== 'granted') return;

    // Skip when the user just granted via the manual 'Enable' flow to avoid a
    // second full subscribe cycle (GET vapid key + unsubscribe + subscribe).
    if (manualSubscribeRef.current) return;

    // Fire silent background subscription to refresh registration on backend
    subscribe().then((result) => {
      if (result.status === 'failed') {
        captureApiError(new Error('push auto-subscribe failed'), 'push auto-subscribe failed');
      }
    });
  }, [user, permission, mounted, subscribe]);

  // 2. Handle soft permission prompt presentation
  useEffect(() => {
    if (!mounted || !user || permission !== 'default') {
      setShowPrompt(false);
      return;
    }

    // Delay prompt presentation slightly for better user onboarding flow
    const timer = setTimeout(() => {
      let isDismissed = false;
      try {
        isDismissed = sessionStorage.getItem('push-prompt-dismissed') === 'true';
      } catch {
        // sessionStorage unavailable (Safari private mode, etc.)
      }
      if (!isDismissed) {
        setShowPrompt(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, permission, mounted]);

  const pushPromptRef = useFocusTrap(showPrompt);

  if (!mounted || !user || !showPrompt) {
    return null;
  }

  const handleDismiss = () => {
    haptic.light();
    setShowPrompt(false);
    try {
      sessionStorage.setItem('push-prompt-dismissed', 'true');
    } catch {
      // sessionStorage unavailable
    }
  };

  const handleSubscribe = async () => {
    if (subscribing) return;
    haptic.medium();
    setSubscribing(true);
    manualSubscribeRef.current = true;
    const result = await subscribe();
    if (result.status === 'subscribed') {
      setShowPrompt(false);
      toast({
        title: 'Notifications enabled',
        description: "You'll get updates on volunteering matches.",
      });
    } else if (result.status === 'failed') {
      // Clear the guard so a later permission/user change can retry instead of
      // being blocked forever.
      manualSubscribeRef.current = false;
      captureApiError(new Error('enable notifications failed'), 'enable notifications failed');
      toast({
        title: 'Could not enable notifications',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } else if (result.status === 'denied') {
      setShowPrompt(false);
    }
    setSubscribing(false);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40 pointer-events-none w-full max-w-sm px-4">
      <div
        ref={pushPromptRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-title"
        aria-describedby="push-desc"
        className="flex flex-col gap-3 bg-brand-surface/98 backdrop-blur-md text-brand-text p-4 md:p-5 rounded-2xl shadow-2xl border border-brand-border animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-brand-bg text-brand-primary">
              <BellRing className="w-4 h-4 motion-safe:animate-bounce" />
            </span>
            <span className="text-xs font-bold font-heading text-brand-text">Enable Updates</span>
          </div>

          <Button
            variant="icon"
            size="icon"
            onClick={handleDismiss}
            aria-label="Not now"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3 id="push-title" className="text-xs font-bold text-brand-text leading-snug">
            Get instant alerts on volunteering matches!
          </h3>
          <p id="push-desc" className="text-[10px] text-brand-muted leading-relaxed">
            Receive real-time notifications for event confirmations, organizer feedback, and new
            opportunities that match your skills.
          </p>
        </div>

        {/* Error feedback */}
        {error && (
          <p className="text-[10px] text-brand-error text-center">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1.5">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="flex-1 text-[10px] font-semibold bg-brand-bg/50 hover:bg-brand-bg rounded-xl"
          >
            Not Now
          </Button>

          <Button
            onClick={handleSubscribe}
            disabled={!!error}
            loading={subscribing}
            className="flex-1 font-heading font-bold text-[10px] rounded-xl shadow-md shadow-brand-primary/20"
          >
            <Sparkles className="w-3 h-3 text-emerald-200" />
            {subscribing ? 'Enabling...' : 'Enable'}
          </Button>
        </div>
      </div>
    </div>
  );
}
