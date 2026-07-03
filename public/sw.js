const CACHE_NAME = 'cirql-shell-v1';
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
  // Only cache GET requests for same-origin non-API assets
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return; // never cache API calls

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
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
