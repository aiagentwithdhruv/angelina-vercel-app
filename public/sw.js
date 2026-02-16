/**
 * Angelina AI - Service Worker v3
 * Network-first for everything except fonts/images.
 * Prevents stale cache issues during active development.
 */

const CACHE_NAME = 'angelina-v3';

// Install: skip waiting immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate: purge ALL old caches, claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Fonts & images — cache-first (they never change)
  if (/\.(woff2?|ttf|eot|png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else (HTML, JS, CSS, API) — network-first
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}
