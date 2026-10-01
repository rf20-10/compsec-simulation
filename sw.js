// CompSec Sim offline cache. Version changes whenever index.html changes.
const V = "compsec-d844e78e5e";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  if (r.mode === "navigate") {
    // Open instantly from the cache (works with no signal); refresh the copy in the background.
    e.respondWith(caches.open(V).then(async c => {
      const hit = await c.match("index.html");
      const net = fetch(r).then(res => { if (res.ok) c.put("index.html", res.clone()); return res; });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    }));
    return;
  }
  e.respondWith(caches.match(r, {ignoreSearch: true}).then(m => m || fetch(r)));
});
