var CACHE = 'qf-v1';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(['/']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (r) { return r || fetch(e.request); })
  );
});

self.addEventListener('push', function (e) {
  var data;
  try { data = e.data.json(); } catch (_) { return; }

  var title = data.title || 'Quest Flow';
  var options = {
    body: data.body || '',
    icon: '/icon.png',
    badge: '/badge.png',
    tag: data.tag || 'default',
    renotify: true,
    data: { reminderId: data.reminderId },
    actions: [
      { action: 'snooze-5', title: '5 min' },
      { action: 'snooze-30', title: '30 min' },
      { action: 'snooze-3600', title: '1 hour' },
      { action: 'snooze-tomorrow', title: 'Tomorrow' },
      { action: 'open', title: 'Open App' }
    ]
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var d = e.notification.data;
  var action = e.action || 'open';

  if (action === 'open') {
    e.waitUntil(clients.openWindow('/'));
    return;
  }

  if (action.indexOf('snooze-') === 0) {
    var dur = action.replace('snooze-', '');
    e.waitUntil(
      fetch('/api/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId: d.reminderId, duration: dur })
      }).then(function () { return clients.openWindow('/'); }).catch(function () { return clients.openWindow('/'); })
    );
  }
});
