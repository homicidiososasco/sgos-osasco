const CACHE = 'sgos-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://unpkg.com/react@17.0.2/umd/react.development.js',
  'https://unpkg.com/react-dom@17.0.2/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.23.2/babel.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// ── Install: cache core assets ──────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network first, fallback to cache ──────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── Push Notifications ───────────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'SGOS', body: 'Nova notificação', icon: '/icon-192.png' };
  try { data = { ...data, ...e.data.json() }; } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'sgos-notif',
      renotify: true,
      data: { url: data.url || '/' }
    })
  );
});

// ── Notification click: open app ─────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});

// ── Background Sync: check for new O.S. ─────────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'NOTIFY_OS') {
    self.registration.showNotification('📋 Nova O.S. — SGOS', {
      body: e.data.msg || 'Nova Ordem de Serviço distribuída para sua equipe.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [300, 100, 300, 100, 300],
      tag: 'nova-os',
      renotify: true
    });
  }
});
