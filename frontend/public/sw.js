// Service Worker for Sempoa SIP TC Pariaman - Network First Strategy
const CACHE_NAME = 'sempoa-sip-cache-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Always bypass API calls, websockets, and uploads
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/uploads/')
  ) {
    return;
  }

  // Network First for HTML and JS bundles so updates are always instant
  if (event.request.mode === 'navigate' || event.request.destination === 'document' || event.request.destination === 'script') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache falling back to network for other static assets (images, icons)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});

// Push notification event listener
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'Sempoa SIP TC Pariaman';
    const options = {
      body: data.body || 'Pemberitahuan baru',
      icon: '/assets/logo/logo-sempoa-sip.png',
      badge: '/assets/logo/logo-sempoa-sip.png',
      data: data.url || '/ortu/dashboard',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Sempoa SIP TC Pariaman', {
        body: text,
        icon: '/assets/logo/logo-sempoa-sip.png',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || '/ortu/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('/ortu') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
