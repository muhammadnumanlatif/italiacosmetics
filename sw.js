const CACHE_NAME = 'italia-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/manifest.json',
  '/ic_logo.svg',
  '/favicon.ico',
  '/favicon-16.png',
  '/favicon-32.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // Network First for API/data + JS/CSS — always get latest code and content
  if (url.includes('/wp-json/') || url.includes('api.italiacosmetics.com') || url.includes('/api/') || url.endsWith('/app.js') || url.endsWith('/style.css')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Every route (/shop, /product-149, /post-101, ...) renders from this same
  // index.html shell — the SPA router reads location.pathname client-side,
  // so there's no separate HTML per route to precache. Fall back to the
  // cached shell for any navigation that isn't already cached and can't
  // reach the network, so the app still opens offline on a route that was
  // never visited before instead of failing outright.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(e.request).then((res) =>
        res || fetch(e.request).catch(() => caches.match('/index.html'))
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
