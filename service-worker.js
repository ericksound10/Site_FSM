const CACHE_NAME = 'condominio-pwa-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/script.js',
  '/style.css',
  '/manifest.json'
];

// 1. Grava os arquivos essenciais no cache assim que instala
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Arquivos essenciais guardados no cache.');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // Força o app a atualizar na hora
  );
});

// 2. Limpa caches antigos quando houver atualizações
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('PWA: Limpando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Retorna o arquivo do cache se existir, mas busca uma versão nova na rede em paralelo
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se a rede falhar e não houver cache, evita que a tela quebre
        return new Response("Offline. Conecte-se à internet para atualizar o portal.");
      });

      return cachedResponse || fetchPromise;
    })
  );
});