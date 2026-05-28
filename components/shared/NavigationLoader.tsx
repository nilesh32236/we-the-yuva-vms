'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import nProgress from 'nprogress';
import { useEffect, useRef } from 'react';

export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPath = useRef(pathname);

  useEffect(() => {
    nProgress.configure({ showSpinner: false, minimum: 0.1, trickleSpeed: 100 });
  }, []);

  useEffect(() => {
    // First mount — nothing to animate
    if (prevPath.current === pathname) return;

    // New page loaded — complete the bar
    nProgress.done();
    prevPath.current = pathname;

    return () => {
      // Navigation starting — begin the bar
      nProgress.start();
    };
  }, [pathname, searchParams]);

  return null;
}
