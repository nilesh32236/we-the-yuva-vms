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

function recordIntendedDestination(event: ExtendableEvent, url: string): void {
  event.waitUntil(
    caches
      .open(INTENDED_DESTINATION_CACHE)
      .then((cache) =>
        cache.put(
          INTENDED_DESTINATION_URL,
          new Response(url, { headers: { 'Content-Type': 'text/plain' } }),
        ),
      )
      .catch(() => {}),
  );
}

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ request, sameOrigin, url }) => {
      if (!sameOrigin || request.method !== 'GET') return false;
      return url.pathname.startsWith('/api/v1/');
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
        // Serve the /offline page only for full-page (destination "document")
        // navigations. This intentionally excludes App Router RSC payload
        // requests: in-app <Link>/router.push transitions fetch flight data
        // with the "RSC" header and an empty request.destination. When that
        // fetch fails while offline, Next.js's router falls back to an MPA
        // (full-page) navigation of the intended URL (see fetch-server-response
        // in next/dist/client/components/router-reducer), which reaches this
        // matcher as a document request — so in-app taps are covered too, and
        // the intended destination recorded here is the route the user tapped.
        // Serving the /offline HTML to the RSC request itself is deliberately
        // avoided: the router expects flight data there and an HTML body breaks
        // the transition.
        matcher({ request, event }) {
          if (request.destination !== 'document') return false;
          recordIntendedDestination(event, request.url);
          return true;
        },
      },
      {
        url: '/icons/offline-placeholder.svg',
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
          // Drop any push subscription so a signed-out (possibly shared) device
          // stops receiving notifications for the previous account.
          const subscription = await self.registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        } catch {
          // Best-effort cleanup — failure is non-fatal.
        }
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
      })(),
    );
    return;
  }

  if (data.type === 'GET_INTENDED_DESTINATION') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(INTENDED_DESTINATION_CACHE);
          const match = await cache.match(INTENDED_DESTINATION_URL);
          const url = match ? await match.text() : '';
          // The destination only needs to survive from the failed navigation to
          // the /offline page render — delete it so a stale URL (potentially
          // containing sensitive query params) never lingers between sessions.
          await cache.delete(INTENDED_DESTINATION_URL);
          (event.source as Client | undefined)?.postMessage({ type: 'INTENDED_DESTINATION', url });
        } catch {
          (event.source as Client | undefined)?.postMessage({ type: 'INTENDED_DESTINATION', url: '' });
        }
      })(),
    );
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
