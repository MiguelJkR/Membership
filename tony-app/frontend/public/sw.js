// TONY AI Service Worker — v4 (network-only for everything except images)
// CRITICAL: never cache JS chunks — they go stale across builds and break the API client.
const CACHE_NAME = "tony-ai-v4";
const STATIC_ASSETS = [
  "/manifest.json",
  "/tony-character-1.png",
  "/tony-character-2.png",
  "/tony-character-3.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS).catch(() => null))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop EVERY old cache (including v1, v2, v3)
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cross-origin or non-GET: don't intercept
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // /api/* and /_next/* (build chunks): NEVER cache — always go to network
  // This fixes the JS chunk cache poisoning across builds.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) {
    return;
  }

  // Static binary assets (images, fonts): cache-first
  const ext = url.pathname.split(".").pop()?.toLowerCase() || "";
  const isStaticAsset = ["png", "jpg", "jpeg", "gif", "svg", "ico", "woff", "woff2", "ttf"].includes(ext);

  if (isStaticAsset) {
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
    return;
  }

  // HTML navigations + everything else: NETWORK ONLY (no cache poisoning)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
