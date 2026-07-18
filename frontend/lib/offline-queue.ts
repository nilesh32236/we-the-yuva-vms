import { api } from './api';

interface QueuedCheckin {
  id?: number;
  eventId: string;
  qrToken?: string;
  location?: { lat: number; lng: number };
  createdAt: number;
  retryCount?: number;
}

const DB_NAME = 'wetheyuva-offline';
const STORE_NAME = 'checkin-queue';
const DB_VERSION = 1;
const MAX_RETRIES = 3;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = (event as IDBVersionChangeEvent).oldVersion;
      switch (oldVersion) {
        case 0:
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueCheckin(data: Omit<QueuedCheckin, 'id' | 'createdAt'>): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).add({ ...data, createdAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    throw new Error('Failed to queue check-in offline');
  }
}

export async function getQueuedCheckins(): Promise<QueuedCheckin[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function removeQueuedCheckin(id: number): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[OfflineQueue] Failed to remove queued check-in:', err);
  }
}

export async function clearQueue(): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail — best-effort cleanup
  }
}

export async function syncQueuedCheckins(): Promise<{ synced: number; failed: number }> {
  try {
    const items = await getQueuedCheckins();

    // Deduplicate: group by eventId+qrToken, keep most recent
    const best = new Map<string, QueuedCheckin>();
    for (const item of items) {
      const key = `${item.eventId}:${item.qrToken ?? ''}`;
      const prev = best.get(key);
      if (!prev || item.createdAt > prev.createdAt) {
        best.set(key, item);
      }
    }

    // Remove duplicate entries from the queue
    const keepIds = new Set([...best.values()].map((i) => i.id));
    for (const item of items) {
      if (item.id != null && !keepIds.has(item.id)) {
        await removeQueuedCheckin(item.id).catch(() => {});
      }
    }

    const uniqueItems = [...best.values()];
    let synced = 0;
    let failed = 0;
    for (const item of uniqueItems) {
      try {
        await api.post(`/events/${item.eventId}/checkin`, {
          qrToken: item.qrToken,
          ...(item.location ? { lat: item.location.lat, lng: item.location.lng } : {}),
        });
        await removeQueuedCheckin(item.id!);
        synced++;
      } catch {
        failed++;
        const retryCount = (item.retryCount ?? 0) + 1;
        if (retryCount >= MAX_RETRIES) {
          await removeQueuedCheckin(item.id!).catch(() => {});
        } else {
          try {
            const db = await openDb();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put({ ...item, retryCount });
          } catch {
            // Best-effort retry tracking
          }
        }
      }
    }
    return { synced, failed };
  } catch {
    return { synced: 0, failed: 0 };
  }
}
