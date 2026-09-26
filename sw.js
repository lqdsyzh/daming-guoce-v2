// Service Worker for 大明国策
// 离线缓存 + 桌面 PWA 支持

const CACHE = 'daming-guoce-v32';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './style.css',
    './script.js',
    './modules.js',
    './data/script.js',
    './data/systems.js',
    './data/achievements.js',
    './data/historian.js',
    './data/advice.js',
    './data/memorials.js',
    './data/memorials_v31.js',
    './data/systems2.js',
    './data/v31_extra.js',
    './data/share.js',
    './data/compare.js',
    './data/extras_ui.js',
    './data/extras2.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => 
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(resp => {
                if (resp && resp.status === 200) {
                    const respClone = resp.clone();
                    caches.open(CACHE).then(c => c.put(e.request, respClone));
                }
                return resp;
            }).catch(() => caches.match('./index.html'));
        })
    );
});
