const CACHE = 'ot-drug-chart-v2';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('script.google.com') || url.hostname.includes('fonts.')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});

self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : { title: 'OT Drug Chart', body: 'Stock alert' };
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
    tag: 'ot-alert', requireInteraction: true,
    actions: [{ action: 'open', title: 'Open app' }, { action: 'dismiss', title: 'Dismiss' }]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow('/');
  }));
});
