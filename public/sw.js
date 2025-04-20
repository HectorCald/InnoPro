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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

