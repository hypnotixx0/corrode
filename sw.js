// sw.js – Full Bolt Unblocker integration (no iframe)
const transports = [
  { name: "Scramjet", prefix: "https://boltunblocker.com/scram/service/" },
  { name: "Epoxy",     prefix: "https://boltunblocker.com/epoxy/" },
  { name: "Libcurl",   prefix: "https://boltunblocker.com/libcurl/" }
];

let currentTransport = 0;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(clients.claim()));

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const client = clients.get(event.clientId);

  // Only rewrite navigation requests and asset requests from our origin
  if (event.request.mode === "navigate" || url.origin === location.origin) {
    const targetUrl = sessionStorage?.getItem?.("corrode-target") || "https://www.google.com";
    const boltUrl = transports[currentTransport].prefix + encodeURIComponent(targetUrl);

    if (event.request.mode === "navigate") {
      event.respondWith(fetch(boltUrl, { headers: { "User-Agent": navigator.userAgent } }));
    } else {
      // For assets (JS/CSS/images), rewrite relative paths
      const rewritten = new URL(boltUrl);
      rewritten.pathname = url.pathname;
      rewritten.search = url.search;
      event.respondWith(fetch(rewritten, { credentials: "include" }));
    }
  }
});

// Message handler – allows proxy.js to change transport
self.addEventListener("message", event => {
  if (event.data?.type === "CHANGE_TRANSPORT") {
    currentTransport = (currentTransport + 1) % transports.length;
    event.source?.postMessage({ type: "TRANSPORT_CHANGED", index: currentTransport });
  }
});