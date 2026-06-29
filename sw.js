// ============ Service Worker — 離線可用 + 秒開（容易學：降低「回來」的門檻） ============
// 策略（避免 PWA 經典「永遠吃到舊版」陷阱）：
//   - 導覽(HTML)：network-first → 線上一定拿到最新版，離線才回退快取的 index.html。
//   - 靜態資產(js/css/icons/manifest)：stale-while-revalidate → 先秒回快取、背景更新，自我修復。
// 每次部署只要 bump CACHE_VER，activate 時清掉舊快取。
const CACHE_VER = "et-v7-2026-06-29";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/style.css",
  "./assets/js/app.js",
  "./assets/js/modes.js",
  "./assets/js/data.js",
  "./assets/js/scoring.js",
  "./assets/js/speech.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_VER).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VER).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 只管同源

  // 導覽請求：network-first，離線回退 index.html
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VER).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // 靜態資產：stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VER).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
