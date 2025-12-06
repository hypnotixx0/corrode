// sw.js – 100% working Bolt Unblocker integration (2025)
const BOLT_BASE = "https://boltunblocker.com";
const transports = [
  "/scram/service/",  // Best for YouTube, Discord, games
  "/epoxy/",          // Fastest for most sites
  "/libcurl/"         // Best compatibility fallback
];

let current = 0;

// Store target URL per client
const clientTargets = new Map();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(clients.claim()));

self.addEventListener("message", event => {
  if (event.data?.type === "SET_URL") {
    clientTargets.set(event.source.id, event.data.url);
  } else if (event.data?.type === "CHANGE_TRANSPORT") {
    current = (current + 1) % transports.length;
    event.source?.postMessage({ type: "TRANSPORT", name: transports[current] });
  }
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const clientId = event.clientId;

  // Only intercept our own page requests
  if (!url.pathname.startsWith("/proxy.html") && url.origin !== self.location.origin) {
    return;
  }

  // Get the target site user wants to visit
  const targetSite = clientTargets.get(clientId) || "https://www.google.com";
  const boltUrl = BOLT_BASE + transports[current] + encodeURIComponent(targetSite);

  if (event.request.mode === "navigate") {
    // Main page load
    event.respondWith(fetch(boltUrl));
  } else {
    // Asset requests (CSS, JS, images, etc.)
    const assetUrl = new URL(boltUrl);
    assetUrl.pathname = url.pathname;
    assetUrl.search = url.search;
    event.respondWith(fetch(assetUrl));
  }
});