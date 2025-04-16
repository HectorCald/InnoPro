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
        return fetch(event.request);
      })
  );
});