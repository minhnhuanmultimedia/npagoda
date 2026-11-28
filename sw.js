/* Service worker cho Npagoda – đổi VERSION mỗi lần cập nhật game để buộc máy người chơi tải bản mới */
const VERSION = 'v1';
const CACHE = 'npagoda-' + VERSION;
const CORE = ['./', './index.html', './manifest.webmanifest', './favicon.png',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('npagoda-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // WebSocket / API / CDN: để trình duyệt tự xử lý
  if (req.mode === 'navigate') { // trang chính: ưu tiên mạng (luôn có bản mới), mất mạng thì dùng bản đã lưu
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
