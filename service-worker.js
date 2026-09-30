
const CACHE_NAME = 'panel-institucional-v1';

const ARCHIVOS_PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ARCHIVOS_PRECACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Interceptar solicitudes
self.addEventListener('fetch', event => {
  const request = event.request;

  // Solo procesar solicitudes GET
  if (request.method !== 'GET') {
    return;
  }

  // Navegación: primero intenta Internet y si falla usa index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });

          return response;
        })
        .catch(() => {
          return caches.match('./index.html');
        })
    );

    return;
  }

  // Archivos y recursos: primero caché y después Internet
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(response => {
            // Guardar solamente respuestas válidas
            if (response && response.status === 200) {
              const responseClone = response.clone();

              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseClone);
              });
            }

            return response;
          });
      })
      .catch(() => {
        return caches.match('./index.html');
      })
  );
});

