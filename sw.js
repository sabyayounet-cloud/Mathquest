// Service Worker for MathQuest Adventures
// Provides offline support and app-like experience

const CACHE_NAME = 'mathquest-v1.0.0';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Bubblegum+Sans&display=swap'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE).catch(() => {
        // Fail gracefully if network is unavailable
        console.log('Cache initialization with network resources skipped (offline)');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if available
      if (response) {
        return response;
      }

      // Try to fetch from network
      return fetch(event.request)
        .then((response) => {
          // Check for valid response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return cached response if available, otherwise return offline page
          return caches.match(event.request);
        });
    })
  );
});
