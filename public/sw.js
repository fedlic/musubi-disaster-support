const CACHE = "musubi-v1";
const OFFLINE = ["/", "/about", "/manual/requester", "/manual/volunteer", "/favicon.svg"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  const path = new URL(event.request.url).pathname;
  if (event.request.method !== "GET" || path.startsWith("/api/") || path.startsWith("/admin") ||
      path.startsWith("/auth") || path.startsWith("/login") || path.startsWith("/mypage") ||
      path.startsWith("/volunteer")) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    if (response.ok) void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/"))));
});
