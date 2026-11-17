// Gildeo – funciona sin conexión.
// Al cambiar algo de la app, sube el número de versión para que los móviles la actualicen.
const VERSION = "gildeo-v2";
const APP = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // La propia app: primero la red (para coger actualizaciones), si no hay conexión, la copia guardada.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match("index.html")))
    );
    return;
  }

  // Fuentes de Google: se guardan la primera vez para usarlas sin conexión.
  if (url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("gstatic.com")) {
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => {
        const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
      }))
    );
  }
});
