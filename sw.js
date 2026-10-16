const CACHE_NAME = 'self-learners-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all([
      cache.add('./index.html').catch(() => null),
      cache.add('./manifest.json').catch(() => null),
      cache.add('./icon-192.png').catch(() => null),
      cache.add('./icon-512.png').catch(() => null),
      cache.add('./app.js').catch(() => null)
    ]))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Never touch the Apps Script iframe or Google resources
  if (request.url.includes('script.google.com') ||
      request.url.includes('googleusercontent.com') ||
      request.url.includes('fonts.googleapis.com') ||
      request.url.includes('fonts.gstatic.com')) {
    return;
  }

  // Navigation / HTML: network-first, fallback to cache
  if (request.mode === 'navigate' ||
      (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Everything else: cache-first, network fallback
  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached)
    )
  );
});
