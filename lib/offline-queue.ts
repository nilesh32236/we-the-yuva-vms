import axios from 'axios';
import { api } from './api';

interface QueuedCheckin {
  id?: number;
  eventId: string;
  qrToken?: string;
  location?: { lat: number; lng: number };
  createdAt: number;
}

const DB_NAME = 'wetheyuva-offline';
const STORE_NAME = 'checkin-queue';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueCheckin(data: Omit<QueuedCheckin, 'id' | 'createdAt'>): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({ ...data, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedCheckins(): Promise<QueuedCheckin[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedCheckin(id: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearQueue(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncQueuedCheckins(): Promise<{ synced: number; failed: number }> {
  const items = await getQueuedCheckins();
  let synced = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await api.post(`/events/${item.eventId}/checkin`, {
        qrToken: item.qrToken,
        ...(item.location ? { lat: item.location.lat, lng: item.location.lng } : {}),
      });
      await removeQueuedCheckin(item.id!);
      synced++;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status &&
        error.response.status >= 400 &&
        error.response.status < 500
      ) {
        await removeQueuedCheckin(item.id!);
      }
      failed++;
    }
  }
  return { synced, failed };
}
