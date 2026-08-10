const CACHE_NAME = 'cirql-shell-v3';
const SHELL_ASSETS = ['/', '/index.html', '/favicon.png', '/icon-192.png', '/icon-badge.png'];

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

  // Set app badge count on home screen icon (Android + Chrome only)
  // This is the red number that appears on the CirQl icon — like Instagram's "2"
  if ('setAppBadge' in navigator && data.badge !== undefined) {
    navigator.setAppBadge(data.badge).catch(() => {});
  } else if ('setAppBadge' in self && data.badge !== undefined) {
    self.setAppBadge(data.badge).catch(() => {});
  }

  // Build actions based on notification type
  const actions = [];

  if (data.type === 'message') {
    actions.push({
      action: 'open',
      title: 'Open Chat',
    });
  } else if (data.type === 'deal') {
    actions.push({
      action: 'open',
      title: 'View Deal',
    });
  }

  const options = {
    body: data.body || 'You have a new notification',
    
    // Use the full app icon — not favicon.ico (too small, looks bad)
    // /icon-192.png is the correct PWA icon
    icon: '/icon-192.png',
    
    // badge: small monochrome icon shown in Android status bar
    // Must be a small transparent/white PNG — use a dedicated badge icon
    badge: '/icon-badge.png',
    
    // Show listing image as rich preview if provided
    // (e.g. when someone messages about a listing — show that listing's photo)
    image: data.image || undefined,
    
    // Vibration pattern: short buzz — long buzz — short buzz
    vibrate: [80, 60, 80],
    
    // tag groups same-conversation notifications so they stack, not spam
    tag: data.tag || 'cirql-notification',
    
    // renotify: true means phone vibrates even if same tag is updated
    renotify: data.type === 'message',
    
    // requireInteraction: keep notification visible until user taps it
    // Only for important things like deal status — not for every message
    requireInteraction: data.type === 'deal',
    
    // Action buttons (Open Chat, View Deal etc.)
    actions: actions,
    
    // Data passed through to notificationclick handler
    data: {
      url: data.url || '/',
      type: data.type || 'general',
    },

    // silent: false means it makes a sound (default behaviour)
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CirQl', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  // Clear the app badge when user taps a notification
  if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge().catch(() => {});
  } else if ('clearAppBadge' in self) {
    self.clearAppBadge().catch(() => {});
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Try to find an already-open CirQl tab and navigate it
      for (const client of clientList) {
        if (new URL(client.url).origin === self.location.origin) {
          if ('navigate' in client) {
            return client.navigate(absoluteUrl).then(c => c.focus());
          }
          return client.focus();
        }
      }
      // No open tab — open a new window
      return clients.openWindow(absoluteUrl);
    })
  );
});
