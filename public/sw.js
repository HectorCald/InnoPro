const CACHE_NAME = 'innopro-v1';
const urlsToCache = [
  '/',
  '/css/login.css',
  '/css/dashboard_db.css',
  '/css/styles/imgUpload.css',
  '/js/login.js',
  '/js/dashboard_db.js',
  '/js/modules/imgUpload.js',
  '/manifest.json'
];

// Cola de sincronización
const syncQueue = new Map();

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // Si falla el fetch, guardamos la petición para sincronizar después
          if (event.request.method === 'POST') {
            syncQueue.set(event.request.url, event.request.clone());
          }
        });
      })
  );
});

// Manejar sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      Promise.all(
        Array.from(syncQueue.entries()).map(([url, request]) => {
          return fetch(request)
            .then(response => {
              if (response.ok) {
                syncQueue.delete(url);
              }
              return response;
            })
            .catch(error => {
              console.error('Error en sincronización:', error);
            });
        })
      )
    );
  }
});

// Registrar para sincronización periódica
self.addEventListener('periodicsync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      Promise.all(
        Array.from(syncQueue.entries()).map(([url, request]) => {
          return fetch(request)
            .then(response => {
              if (response.ok) {
                syncQueue.delete(url);
              }
              return response;
            });
        })
      )
    );
  }
});