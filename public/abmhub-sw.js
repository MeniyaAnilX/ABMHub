const ABMHUB_IMAGE_CACHE = "abmhub-image-cache-v1";
const MAX_ITEMS = 180;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ITEMS) return;
  await Promise.all(keys.slice(0, keys.length - MAX_ITEMS).map((key) => cache.delete(key)));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;
  if (request.destination !== "image") return;

  event.respondWith(
    caches.open(ABMHUB_IMAGE_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response && response.status < 500) {
          cache.put(request, response.clone());
          trimCache(cache);
        }
        return response;
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    })
  );
});
