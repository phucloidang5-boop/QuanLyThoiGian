/* ═══════════════════════════════════════════════════════════
    STUDY TRACKER — Service Worker
    Chiến lược:
    - HTML: network-first (bản mới nhất khi online)
    - Static (CSS, JS, WASM): cache-first (nhanh + offline)
    ═══════════════════════════════════════════════════════════ */

    // ✅ FIX: bump version + thêm timer-worker.js
    const CACHE_NAME = 'study-tracker-v7';
    const OFFLINE_URLS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './db.js',
    './migrate.js',
    './timer-worker.js',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/sql-wasm.js',
    'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/sql-wasm.wasm',
    ];

    self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
        return Promise.all(
            OFFLINE_URLS.map((url) =>
            cache.add(url).catch((err) => {
                console.warn('[SW] Bỏ qua không cache được:', url, '—', err.message);
            })
            )
        );
        }).then(() => self.skipWaiting())
    );
    });

    self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) => {
        return Promise.all(
            names
            .filter((n) => n !== CACHE_NAME)
            .map((n) => caches.delete(n))
        );
        }).then(() => self.clients.claim())
    );
    });

    self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (!url.protocol.startsWith('http')) return;

    if (request.destination === 'document' || request.url.endsWith('.html')) {
        event.respondWith(
        fetch(request)
            .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy));
            return res;
            })
            .catch(() => caches.match(request).then((r) => r || caches.match('./index.html')))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
            if (!res || res.status !== 200 || res.type === 'opaque') return res;
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy));
            return res;
        }).catch(() => {
            return new Response('Offline — không tải được', {
            status: 503,
            statusText: 'Offline',
            });
        });
        })
    );
    });

    self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
    if (event.data === 'CLEAR_CACHE') {
        caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))));
    }
    });