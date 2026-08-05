'use client';

import { useCallback, useEffect, useState } from 'react';
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

  const subscribe = useCallback(async () => {
    if (permission === 'unsupported') return;
    if (permission === 'denied') {
      setError('Push notifications are blocked. Please enable them in your browser settings.');
      return;
    }

    try {
      setError(null);
      if (Notification.permission !== 'granted') {
        const notifPermission = await Notification.requestPermission();
        setPermission(notifPermission);
        if (notifPermission !== 'granted') return;
      }

      const response = await api.get('/vapid-public-key').then((r) => r.data);
      const publicKey = response.publicKey;
      if (typeof publicKey !== 'string' || !publicKey) {
        throw new Error('Invalid VAPID configuration from server');
      }

      // Normalize a key/string to base64url for comparison.
      const toBase64Url = (value: string) =>
        value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      let subscription = existing ?? null;
      if (subscription) {
        const existingKeyBuffer = subscription.options.applicationServerKey;
        const existingKey = existingKeyBuffer
          ? toBase64Url(btoa(String.fromCharCode(...new Uint8Array(existingKeyBuffer))))
          : null;
        // Reuse the existing browser subscription when it is still current
        // instead of unsubscribing + re-subscribing on every call. Only tear it
        // down when the VAPID key differs (or is missing). This stops each full
        // page load from churning the endpoint and orphaning DB rows.
        if (existingKey && existingKey === toBase64Url(publicKey)) {
          await api.post('/notifications/subscribe', subscription.toJSON());
          return;
        }
        await subscription.unsubscribe();
        subscription = null;
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      await api.post('/notifications/subscribe', newSubscription.toJSON());
    } catch (err) {
      console.error('Failed to subscribe to push notifications');
      setError('Failed to set up push notifications. Please try again.');
      throw err;
    }
  }, [permission]);

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
