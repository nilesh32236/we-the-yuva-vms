'use client';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import {
  queueCheckin,
  getQueuedCheckins,
  syncQueuedCheckins,
  clearQueue,
} from '@/lib/offline-queue';
import { CheckInSchema } from '@/lib/shared';
import { useAuth } from '@/hooks/useAuth';

const errorMap: Record<string, string> = {
  'Event not found': 'Check-in failed',
  'Event is not active': 'Check-in failed',
  'Invalid QR code': 'Check-in failed',
  'QR code expired': 'Check-in failed',
  'Already checked in': 'Already checked in',
  'Check-in not allowed': 'Check-in not allowed',
  'Volunteer not registered': 'Check-in failed',
};

function mapApiError(backendError?: string): string {
  if (!backendError) return 'Check-in failed';
  return errorMap[backendError] ?? 'An error occurred';
}

interface UseOfflineCheckinOptions {
  eventId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useOfflineCheckin({ eventId, onSuccess, onError }: UseOfflineCheckinOptions) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);
  const prevUserRef = useRef(user);
  const userIdRef = useRef(user?.id);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  useEffect(() => {
    if (prevUserRef.current != null && user == null) {
      try {
        clearQueue();
      } catch {
        // Queue clear failed silently — UI will reset below
      } finally {
        setQueuedCount(0);
      }
    }
    prevUserRef.current = user;
  }, [user]);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    const result = await syncQueuedCheckins(userIdRef.current);
    if (result.failed === 0) {
      retryAttemptRef.current = 0;
      if (onSuccessRef.current) onSuccessRef.current();
    } else {
      const backoff = [10000, 30000, 60000];
      const delay = backoff[Math.min(retryAttemptRef.current, backoff.length - 1)];
      retryAttemptRef.current++;
      if (onErrorRef.current) {
        onErrorRef.current(
          `Synced ${result.synced} of ${result.synced + result.failed} check-in(s)`
        );
      }
      retryTimeoutRef.current = setTimeout(sync, delay);
    }
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      retryAttemptRef.current = 0;
      sync();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [sync]);

  const retrySync = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    retryAttemptRef.current = 0;
    sync();
  }, [sync]);

  const refreshQueue = useCallback(async () => {
    const items = await getQueuedCheckins();
    setQueuedCount(items.length);
  }, []);

  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  const checkinMutation = useMutation({
    mutationFn: async (body: { qrToken?: string; lat?: number; lng?: number }) => {
      const parsed = CheckInSchema.safeParse(body);
      if (!parsed.success) {
        throw new Error('Invalid check-in data');
      }
      if (!isOnline) {
        try {
          await queueCheckin({
            eventId,
            qrToken: body.qrToken,
            location: body.lat != null ? { lat: body.lat, lng: body.lng ?? 0 } : undefined,
          }, userIdRef.current);
        } catch {
          throw new Error('Failed to queue check-in offline');
        }
        await refreshQueue();
        return { queued: true };
      }
      return api.post(`/events/${eventId}/checkin`, body).then((r) => r.data);
    },
    onSuccess: (data) => {
      if (data.queued) return;
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => {
      if (onError) {
        const message =
          err instanceof Error
            ? err.message
            : mapApiError(
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error
              );
        onError(message);
      }
    },
  });

  return {
    checkin: checkinMutation.mutate,
    isPending: checkinMutation.isPending,
    isSyncing,
    queuedCount,
    isOffline: !isOnline,
    retrySync,
  };
}
