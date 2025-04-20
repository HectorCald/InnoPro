const CACHE_NAME = 'innopro-v1';
const urlsToCache = [
  '/',
  '/css/login.css',
  '/css/dashboard_db.css',
  '/js/login.js',
  '/js/dashboard_db.js',
  '/manifest.json'
];

// Cola de sincronización
const syncQueue = new Map();

// Modificar el evento fetch para forzar modo offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match('/offline.html'))
  );
});
