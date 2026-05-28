/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate, Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
  runtimeCaching: [
    // Google Fonts — cache first, long TTL
    {
      matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: 'google-fonts-stylesheets',
      }),
    },
    {
      matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: 'google-fonts-webfonts',
      }),
    },
    // Unsplash images — cache first
    {
      matcher: /^https:\/\/images\.unsplash\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: 'unsplash-images',
      }),
    },
    // API calls — network first, fall back to cache (stale data is better than nothing)
    {
      matcher: /\/api\/v1\/.*/i,
      handler: new NetworkFirst({
        cacheName: 'api-responses',
        networkTimeoutSeconds: 10,
      }),
    },
    // Next.js static assets — stale while revalidate
    {
      matcher: /\/_next\/static\/.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'next-static-assets',
      }),
    },
    // Next.js image optimisation
    {
      matcher: /\/_next\/image\?.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'next-image-optimisation',
      }),
    },
  ],
});

serwist.addEventListeners();

// ─── Push Notifications ───────────────────────────────────────────

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
    // payload wasn't JSON — ignore
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link;
  if (link) {
    event.waitUntil(self.clients.openWindow(link));
  }
});
