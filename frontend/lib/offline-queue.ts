import { z } from 'zod';

import { api } from './api';
import { encrypt, decrypt } from './crypto-utils';
import { captureApiError } from './sentry';

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

const QueuedCheckinSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  qrToken: z.string().optional(),
  location: z
    .object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
    })
    .optional(),
});

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

async function decryptCheckin(
  item: QueuedCheckin,
  userId: string
): Promise<{ item: QueuedCheckin; invalid: boolean }> {
  const decrypted = { ...item };
  let invalid = false;
  if (item.encryptedQrToken) {
    const plain = await decrypt(item.encryptedQrToken, userId);
    if (plain) {
      decrypted.qrToken = plain;
    } else {
      invalid = true;
      captureApiError(
        new Error('Failed to decrypt offline check-in qrToken'),
        'offline check-in decrypt failed',
        { userId }
      );
    }
  }
  if (item.encryptedLocation) {
    const plain = await decrypt(item.encryptedLocation, userId);
    if (plain) {
      const loc = decodeLocation(plain);
      if (loc) decrypted.location = loc;
    }
  }
  return { item: decrypted, invalid };
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
      // Schema migration pattern:
      // - case 0: initial creation
      // - case N: alter schema from version N to N+1
      // Always fall through to handle cumulative migrations.
      switch (oldVersion) {
        case 0:
        case 1:
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
  const parsed = QueuedCheckinSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Invalid check-in data: ${parsed.error.errors.map((e) => e.message).join(', ')}`
    );

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
    captureApiError(err, 'failed to remove queued check-in');
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

export async function syncQueuedCheckins(
  userId?: string
): Promise<{ synced: number; failed: number; dropped: number; error?: boolean }> {
  try {
    let items = await getQueuedCheckins();
    let dropped = 0;
    if (userId) {
      const decrypted = await Promise.all(items.map((item) => decryptCheckin(item, userId)));
      items = [];
      for (const d of decrypted) {
        if (d.invalid && d.item.id != null) {
          dropped++;
          await removeQueuedCheckin(d.item.id).catch(() => {});
        } else {
          items.push(d.item);
        }
      }
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
          dropped++;
          captureApiError(
            new Error(`Offline check-in permanently dropped after ${MAX_RETRIES} attempts`),
            'queued check-in dropped after max retries',
            { eventId: item.eventId }
          );
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
    return { synced, failed, dropped };
  } catch (err) {
    captureApiError(err, 'offline check-in sync failed catastrophically');
    return { synced: 0, failed: 0, dropped: 0, error: true };
  }
}
