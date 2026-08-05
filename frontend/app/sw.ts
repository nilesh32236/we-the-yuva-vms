/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { NetworkOnly, Serwist, type RuntimeCaching } from 'serwist';
import { defaultCache } from '@serwist/turbopack/worker';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const INTENDED_DESTINATION_CACHE = 'offline-navigation';
const INTENDED_DESTINATION_URL = '/intended-destination';

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ request, sameOrigin, url }) => {
      if (!sameOrigin || request.method !== 'GET') return false;
      return /^\/(api\/v1\/auth|api\/v1\/users\/me|api\/v1\/notifications|api\/v1\/profile|api\/v1\/dashboard)(\/|$)/i.test(
        url.pathname,
      );
    },
    handler: new NetworkOnly(),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // skipWaiting intentionally omitted — AppUpdatePrompt handles this via SKIP_WAITING postMessage
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request, event }) {
          if (request.destination !== 'document') return false;
          event.waitUntil(
            caches
              .open(INTENDED_DESTINATION_CACHE)
              .then((cache) =>
                cache.put(
                  INTENDED_DESTINATION_URL,
                  new Response(request.url, { headers: { 'Content-Type': 'text/plain' } }),
                ),
              )
              .catch(() => {})
          );
          return true;
        },
      },
      {
        url: '/offline-placeholder.svg',
        matcher({ request }) {
          return request.destination === 'image';
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'LOGOUT') {
    event.waitUntil(
      (async () => {
        try {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((name) => !name.includes('precache'))
              .map((name) => caches.delete(name)),
          );
        } catch {
          // Best-effort cleanup — failure is non-fatal.
        }
      })()
    );
    return;
  }

  if (data.type === 'GET_INTENDED_DESTINATION') {
    (async () => {
      try {
        const cache = await caches.open(INTENDED_DESTINATION_CACHE);
        const match = await cache.match(INTENDED_DESTINATION_URL);
        const url = match ? await match.text() : '';
        (event.source as Client | undefined)?.postMessage({ type: 'INTENDED_DESTINATION', url });
      } catch {
        (event.source as Client | undefined)?.postMessage({ type: 'INTENDED_DESTINATION', url: '' });
      }
    })();
  }
});

// ─── Push Notifications ───────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'WeTheYuva';
    const options: NotificationOptions & { vibrate?: number[] } = {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      data: { link: data.link },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    console.warn('Push event received non-JSON payload');
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link;
  if (link) {
    event.waitUntil(self.clients.openWindow(link));
  }
});
