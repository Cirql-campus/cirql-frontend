const CACHE_NAME = 'cirql-shell-v2';
const SHELL_ASSETS = ['/', '/index.html', '/favicon.png', '/icon-192.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Never intercept API calls — always go to network
  if (url.pathname.startsWith('/api/')) return;

  // Never intercept cross-origin requests
  if (url.origin !== self.location.origin) return;

  // HTML documents — NETWORK FIRST
  // Always fetch fresh index.html from Vercel so new JS bundle
  // filenames are always correct after a deploy.
  // Falls back to cache only when completely offline.
  const isHTMLRequest =
    event.request.mode === 'navigate' ||
    event.request.headers.get('accept')?.includes('text/html');

  if (isHTMLRequest) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (JS, CSS, images) — CACHE FIRST
  // Safe because Vite gives them hashed filenames — content never changes.
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
  // Everything else — network only, no caching
});

self.addEventListener('push', function(event) {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Error parsing push data', e);
    }
  }

  const options = {
    body: data.body || 'You have a new notification!',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    tag: data.tag || data.url || 'cirql-notification',
    renotify: Boolean(data.renotify),
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CirQl', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if ('focus' in client && new URL(client.url).origin === self.location.origin) {
          if ('navigate' in client) {
            return client.navigate(absoluteUrl).then(function(navigatedClient) {
              return navigatedClient.focus();
            });
          }
          return client.focus();
        }
      }

      return clients.openWindow(absoluteUrl);
    })
  );
});
