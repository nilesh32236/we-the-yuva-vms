// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if currently running in standalone display mode (installed)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in navigator &&
          (navigator as Navigator & { standalone?: boolean }).standalone === true);
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for custom installation completion
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstallPromptEvent(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPromptEvent) {
      return false;
    }

    // Show the install prompt
    await installPromptEvent.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await installPromptEvent.userChoice;

    if (outcome === 'accepted') {
      // Consumed the prompt event, clear it
      setInstallPromptEvent(null);
      return true;
    }

    return false;
  };

  return {
    isInstallable: !!installPromptEvent && !isStandalone,
    isStandalone,
    install,
  };
}
