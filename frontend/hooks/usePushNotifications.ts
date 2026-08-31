'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export type PushSubscribeResult =
  | { status: 'subscribed' }
  | { status: 'denied'; reason: 'unsupported' | 'blocked' | 'not-granted' }
  | { status: 'failed' };

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [error, setError] = useState<string | null>(null);

  const vapidQuery = useQuery({
    queryKey: ['vapid-public-key'],
    queryFn: () => api.get<{ publicKey?: string }>('/vapid-public-key').then((r) => r.data),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    if (
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, [user]);

  const subscribe = useCallback(async (): Promise<PushSubscribeResult> => {
    if (permission === 'unsupported') {
      setPermission('unsupported');
      return { status: 'denied', reason: 'unsupported' };
    }
    if (permission === 'denied') {
      setError('Push notifications are blocked. Please enable them in your browser settings.');
      return { status: 'denied', reason: 'blocked' };
    }

    try {
      setError(null);
      if (Notification.permission !== 'granted') {
        const notifPermission = await Notification.requestPermission();
        setPermission(notifPermission);
        if (notifPermission !== 'granted') {
          return { status: 'denied', reason: 'not-granted' };
        }
      }

      const publicKey = vapidQuery.data?.publicKey;
      if (typeof publicKey !== 'string' || !publicKey) {
        throw new Error('Invalid VAPID configuration from server');
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      await api.post('/notifications/subscribe', subscription.toJSON());
      return { status: 'subscribed' };
    } catch (err) {
      console.error('Failed to subscribe to push notifications', err);
      setError('Failed to set up push notifications. Please try again.');
      return { status: 'failed' };
    }
  }, [permission, vapidQuery.data]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await api.post('/notifications/unsubscribe', { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
    } catch {
      console.error('Failed to unsubscribe');
    }
  }, []);

  return { permission, subscribe, unsubscribe, error };
}
