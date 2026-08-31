'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import {
  queueCheckin,
  getQueuedCheckins,
  syncQueuedCheckins,
  clearQueue,
} from '@/lib/offline-queue';
import { useAuth } from '@/hooks/useAuth';

const MAX_SYNC_ATTEMPTS = 5;

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
  onSuccess?: (result?: { queued?: boolean }) => void;
  onError?: (error: string) => void;
}

export function useOfflineCheckin({ eventId, onSuccess, onError }: UseOfflineCheckinOptions) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);
  const syncingRef = useRef(false);
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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      retryAttemptRef.current = 0;
      setSyncFailed(false);
      (async () => {
        try {
          await clearQueue();
        } catch (err) {
          console.warn('[OfflineCheckin] Failed to clear offline queue:', err);
        }
        const remaining = await getQueuedCheckins();
        setQueuedCount(remaining.length);
      })();
    }
    prevUserRef.current = user;
  }, [user]);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const result = await syncQueuedCheckins(userIdRef.current);
      if (result.error) {
        const backoff = [10000, 30000, 60000];
        const delay = backoff[Math.min(retryAttemptRef.current, backoff.length - 1)];
        const firstFailure = retryAttemptRef.current === 0;
        retryAttemptRef.current++;
        setSyncFailed(true);
        if (firstFailure && onErrorRef.current) {
          onErrorRef.current('Offline check-in sync failed. It will be retried automatically.');
        }
        if (retryAttemptRef.current < MAX_SYNC_ATTEMPTS) {
          retryTimeoutRef.current = setTimeout(sync, delay);
        }
      } else if (result.failed === 0) {
        retryAttemptRef.current = 0;
        setSyncFailed(false);
        await queryClient.invalidateQueries({ queryKey: ['attendance', eventId] });
        if (onSuccessRef.current) onSuccessRef.current();
      } else {
        const backoff = [10000, 30000, 60000];
        const delay = backoff[Math.min(retryAttemptRef.current, backoff.length - 1)];
        const firstFailure = retryAttemptRef.current === 0;
        retryAttemptRef.current++;
        setSyncFailed(true);
        if (firstFailure && onErrorRef.current) {
          const droppedMsg =
            result.dropped > 0 ? ` ${result.dropped} check-in(s) could not be submitted.` : '';
          onErrorRef.current(
            `Synced ${result.synced} of ${result.synced + result.failed} check-in(s).${droppedMsg}`
          );
        }
        if (retryAttemptRef.current < MAX_SYNC_ATTEMPTS) {
          retryTimeoutRef.current = setTimeout(sync, delay);
        }
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
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
    (async () => {
      const items = await getQueuedCheckins();
      setQueuedCount(items.length);
      if (items.length > 0 && typeof navigator !== 'undefined' && navigator.onLine) {
        sync();
      }
    })();
  }, [sync]);

  const checkinMutation = useMutation({
    mutationFn: async (body: { qrToken?: string; lat?: number; lng?: number }) => {
      if (!isOnline) {
        try {
          await queueCheckin(
            {
              eventId,
              qrToken: body.qrToken,
              location: body.lat != null ? { lat: body.lat, lng: body.lng ?? 0 } : undefined,
            },
            userIdRef.current
          );
        } catch {
          throw new Error('Failed to queue check-in offline');
        }
        await refreshQueue();
        return { queued: true };
      }
      return api.post(`/events/${eventId}/checkin`, body).then((r) => r.data);
    },
    onSuccess: (data) => {
      if (data.queued) {
        onSuccessRef.current?.({ queued: true });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['attendance', eventId] });
      onSuccessRef.current?.({ queued: false });
    },
    onError: (err: unknown) => {
      if (onErrorRef.current) {
        const message =
          err instanceof Error
            ? err.message
            : mapApiError(
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error
              );
        onErrorRef.current(message);
      }
    },
  });

  return {
    checkin: checkinMutation.mutate,
    checkinAsync: checkinMutation.mutateAsync,
    isPending: checkinMutation.isPending,
    isSyncing,
    queuedCount,
    isOffline: !isOnline,
    retrySync,
    syncFailed,
  };
}

// Backward compatibility: original page-level sync hook (eventId string)
export function useOfflineCheckinSync(eventId: string) {
  const { isOffline, isSyncing, queuedCount, retrySync, syncFailed } = useOfflineCheckin({
    eventId,
  });
  return { isOnline: !isOffline, isSyncing, queuedCount, retrySync, syncFailed };
}
