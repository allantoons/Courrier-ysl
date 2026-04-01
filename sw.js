// Service Worker — Courrier YSL
// Permet l'utilisation hors-ligne (cache des assets)

const CACHE_NAME = 'courrier-ysl-v1';

const ASSETS_TO_CACHE = [
  './sl-courrier.html',
  './manifest.json'
];

// Installation : mise en cache des assets principaux
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch : stratégie Network First, fallback cache
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes externes (Google Fonts, ZXing CDN, etc.)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre à jour le cache avec la nouvelle version
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Pas de réseau → servir depuis le cache
        return caches.match(event.request);
      })
  );
});
