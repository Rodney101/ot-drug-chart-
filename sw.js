const CACHE = 'ot-v5-202605100231';
const ASSETS = [
  '/ot-drug-chart-/',
  '/ot-drug-chart-/index.html',
  '/ot-drug-chart-/manifest.json',
  '/ot-drug-chart-/icons/icon-192.png',
  '/ot-drug-chart-/icons/icon-512.png'
];

// Install — skip waiting immediately so new SW activates without delay
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(ASSETS.map(url => c.add(url)))
    )
  );
});

// Activate — delete ALL old caches immediately, claim all clients
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('Deleting old cache:', k);
        return caches.delete(k);
      })))
      .then(() => self.clients.claim())
  );
});

// Message handler — allow page to force skip waiting
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('script.google.com')) return;
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('/ot-drug-chart-/index.html');
      });
    })
  );
});
