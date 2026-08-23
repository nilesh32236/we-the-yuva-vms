'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    let focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);

    const refreshFocusables = () => {
      focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
      // Self-start the trap once focusable content renders (async/loading
      // dialog bodies) and focus is not already inside the container.
      if (focusables.length > 0 && !container.contains(document.activeElement)) {
        focusables[0].focus();
      }
    };

    // Engage the trap immediately if the container already has focusables.
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const observer = new MutationObserver(refreshFocusables);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'tabindex'],
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || container.contains(target)) return;
      refreshFocusables();
      if (focusables.length === 0) return;
      focusables[0].focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return ref;
}
