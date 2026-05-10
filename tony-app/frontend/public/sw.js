// TONY AI Service Worker — v3 (network-first HTML, cache-only static assets)
// Bumping CACHE_NAME forces clients to drop old caches on next reload.
const CACHE_NAME = "tony-ai-v3";
const STATIC_ASSETS = [
  "/manifest.json",
  "/tony-character-1.png",
  "/tony-character-2.png",
  "/tony-character-3.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  // Activate immediately on install — don't wait for old SW to die
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS).catch(() => null))
  );
});

self.addEventListener("activate", (event) => {
  // Take control of all open clients without requiring reload
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // API: always go to network, no SW interception (avoid stale data)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // HTML/RSC navigations: NETWORK-FIRST so users always see latest UI
  const isHtml =
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") || "").includes("text/html") ||
    url.pathname === "/" ||
    !url.pathname.includes(".");

  if (isHtml) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets (images, fonts, manifest): cache-first with background refresh
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((res) => {
          if (res && res.ok && res.type === "basic") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)).catch(() => null);
          }
          return res;
        })
    )
  );
});

// Allow client page to trigger immediate update
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
