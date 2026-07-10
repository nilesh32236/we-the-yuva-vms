'use client';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { queueCheckin, getQueuedCheckins, syncQueuedCheckins } from '@/lib/offline-queue';

interface UseOfflineCheckinOptions {
  eventId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useOfflineCheckin({ eventId, onSuccess, onError }: UseOfflineCheckinOptions) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      const result = await syncQueuedCheckins();
      if (result.synced > 0 && onSuccess) onSuccess();
      if (result.failed > 0 && onError) onError(`${result.failed} check-in(s) failed to sync`);
      setIsSyncing(false);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onSuccess, onError]);

  const refreshQueue = useCallback(async () => {
    const items = await getQueuedCheckins();
    setQueuedCount(items.length);
  }, []);

  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  const checkinMutation = useMutation({
    mutationFn: async (body: { qrToken?: string; lat?: number; lng?: number }) => {
      if (!isOnline) {
        try {
          await queueCheckin({
            eventId,
            qrToken: body.qrToken,
            location: body.lat != null ? { lat: body.lat, lng: body.lng ?? 0 } : undefined,
          });
        } catch {
          throw new Error('Failed to queue check-in offline');
        }
        await refreshQueue();
        if (onSuccess) onSuccess();
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
            : (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
              'Check-in failed';
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
  };
}
