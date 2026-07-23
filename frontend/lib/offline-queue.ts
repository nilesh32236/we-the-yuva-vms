import { api } from './api';
import { encrypt, decrypt } from './crypto-utils';

import { CheckInSchema } from '@/lib/shared';

interface QueuedCheckin {
  id?: number;
  eventId: string;
  qrToken?: string;
  location?: { lat: number; lng: number };
  encryptedQrToken?: string;
  encryptedLocation?: string;
  createdAt: string;
  retryCount?: number;
}

function encodeLocation(loc: { lat: number; lng: number }): string {
  return JSON.stringify(loc);
}

function decodeLocation(s: string): { lat: number; lng: number } | undefined {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

async function decryptCheckin(item: QueuedCheckin, userId: string): Promise<QueuedCheckin> {
  const decrypted = { ...item };
  if (item.encryptedQrToken) {
    const plain = await decrypt(item.encryptedQrToken, userId);
    if (plain) decrypted.qrToken = plain;
  }
  if (item.encryptedLocation) {
    const plain = await decrypt(item.encryptedLocation, userId);
    if (plain) {
      const loc = decodeLocation(plain);
      if (loc) decrypted.location = loc;
    }
  }
  return decrypted;
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

export async function queueCheckin(
  data: Omit<QueuedCheckin, 'id' | 'createdAt'>,
  userId?: string
): Promise<void> {
  const parsed = CheckInSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid check-in data');
  }
  try {
    const db = await openDb();
    const stored: QueuedCheckin = { ...data, createdAt: new Date().toISOString() };
    if (userId) {
      if (stored.qrToken) {
        stored.encryptedQrToken = await encrypt(stored.qrToken, userId);
        delete stored.qrToken;
      }
      if (stored.location) {
        stored.encryptedLocation = await encrypt(encodeLocation(stored.location), userId);
        delete stored.location;
      }
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).add(stored);
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

export async function syncQueuedCheckins(userId?: string): Promise<{ synced: number; failed: number }> {
  try {
    let items = await getQueuedCheckins();
    if (userId) {
      items = await Promise.all(items.map((item) => decryptCheckin(item, userId)));
    }

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
