'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [error, setError] = useState<string | null>(null);

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

  const subscribe = async () => {
    if (permission === 'unsupported') return;
    if (permission === 'denied') {
      alert('Push notifications are blocked. Please enable them in your browser settings.');
      return;
    }

    try {
      setError(null);
      if (Notification.permission === 'granted') {
        // Permission already granted, proceed to subscribe
      } else {
        const notifPermission = await Notification.requestPermission();
        setPermission(notifPermission);
        if (notifPermission !== 'granted') return;
      }

      const { publicKey } = await api.get('/vapid-public-key').then((r) => r.data);

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
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
      setError('Failed to set up push notifications. Please try again.');
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await api.post('/notifications/unsubscribe', { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  };

  return { permission, subscribe, unsubscribe, error };
}
