const CACHE_NAME = "erranza-v1";
const OFFLINE_URLS = ["/", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests for same-origin resources
  if (event.request.method !== "GET") return;
  
  const url = new URL(event.request.url);
  
  // Don't cache API calls or Supabase requests
  if (url.pathname.startsWith("/rest/") || url.hostname.includes("supabase")) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache navigations and assets
        if (response.ok && (url.pathname.match(/\.(js|css|png|jpg|svg|ico|woff2?)$/) || event.request.mode === "navigate")) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Serve from cache on network failure
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});
