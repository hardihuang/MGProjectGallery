// MG Gallery Service Worker v2 — Image Pre-Cache Edition
const STATIC_CACHE = 'mg-gallery-static-v2';
const IMAGE_CACHE  = 'mg-gallery-images-v2';
const DATA_CACHE   = 'mg-gallery-data-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './projects.json',
  './manifest.json',
  './logo.svg',
];

// ── Install: cache static shell ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener('activate', e => {
  const KEEP = [STATIC_CACHE, IMAGE_CACHE, DATA_CACHE];
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !KEEP.includes(k)).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Message: receive image URLs to pre-cache ──
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'CACHE_IMAGES' && Array.isArray(e.data.urls)) {
    const urls = e.data.urls;
    // Fire-and-forget: pre-cache all image URLs in background
    e.waitUntil(
      caches.open(IMAGE_CACHE).then(cache => {
        return Promise.allSettled(
          urls.map(url =>
            fetch(url).then(res => {
              if (res.ok) cache.put(url, res);
            }).catch(() => { /* silently skip failed images */ })
          )
        );
      })
    );
  }
});

// ── Fetch: smart caching strategy ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);

  // ── JSON data: network-first ──
  if (url.pathname.endsWith('projects.json') || url.pathname.includes('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(DATA_CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // ── Images: cache-first with background refresh ──
  if (isImage) {
    e.respondWith(
      caches.open(IMAGE_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          // Return cached instantly if available
          if (cached) return cached;
          // Otherwise fetch from network and cache
          return fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => {
            // If network fails and we have nothing, return a tiny placeholder
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#f0f0f0" width="400" height="300"/><text x="200" y="150" text-anchor="middle" fill="#999" font-size="16" font-family="sans-serif">图片离线</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
        })
      )
    );
    return;
  }

  // ── Everything else: cache-first ──
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
