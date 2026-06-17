self.addEventListener('push', function (e) {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'Polla Mundial 2026';
  const body = data.body || 'Hay novedades en la polla';
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: data.tag || 'polla',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (list) {
        for (const c of list) {
          if ('focus' in c) return c.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
