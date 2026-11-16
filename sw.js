// Service Worker for 大明国策 v8.4
// 完整预缓存页面实际依赖的本地资源；避免脚本请求失败时错误返回 HTML。

const CACHE = 'daming-guoce-v84';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './icon-192.png',
  './icon-512.png',
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
  './data/extras2.js',
  './data/events_ext.js',
  './data/memorials_ext.js',
  './data/advice_ext.js',
  './data/achievements_ext.js',
  './modules.js',
  './overview.js',
  './sfx.js',
  './yearend.js',
  './mobileui.js',
  './script.js',
  './map.js',
  './map_v67.js',
  './map_province.js',
  './daming_talk.js',
  './cangwei.js',
  './expedition.js',
  './court_session.js',
  './harem_interact.js',
  './diplomacy_interact.js',
  './keju.js',
  './keju_deep.js',
  './yingzao.js',
  './military_ops_ext.js',
  './junpi.js',
  './zaiyi.js',
  './lizhi.js',
  './auto.js',
  './batch5_bridge.js',
  './economy_market.js',
  './govern.js',
  './mainline.js',
  './battlefield.js',
  './military_war_def.js',
  './military_tech_ext.js',
  './v5d_ui.js',
  './intrigue.js',
  './missions.js',
  './harem_prince.js',
  './zongfan.js',
  './qiuzhuji.js',
  './tianming.js',
  './xinxing.js',
  './chaohui.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith('daming-guoce-') && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      return new Response('当前资源暂不可用，请检查网络后重试。', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
