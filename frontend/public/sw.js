// Service Worker for Sempoa SIP TC Pariaman Web Push Notifications

self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Sempoa SIP TC Pariaman';
    const options = {
      body: data.body || 'Ada pengingat baru dari Sempoa SIP.',
      icon: data.icon || '/assets/logo/logo-sempoa-sip.png',
      badge: data.badge || '/assets/logo/logo-sempoa-sip.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/ortu/keuangan',
        dateOfArrival: Date.now()
      },
      actions: [
        {
          action: 'open_url',
          title: 'Lihat Tagihan'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Error handling push event in Service Worker:', err);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/ortu/keuangan';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus if already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
