'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushSubscriber() {
  const { user } = useAuth();
  const { subscribe } = usePushNotifications();
  const done = useRef(false);

  useEffect(() => {
    if (user && !done.current) {
      done.current = true;
      subscribe();
    }
    if (!user) done.current = false;
  }, [user, subscribe]);

  return null;
}
