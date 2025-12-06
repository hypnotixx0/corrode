// sw.js — Uses YOUR private Worker (no Google CAPTCHA ever)
importScripts("https://unpkg.com/@tomphttp/bare-client@2.2.0-alpha/dist/bare.cjs.js");

const BARE_SERVER = "https://corrodeproxy.joshaburrjr.workers.dev/bare/";
let client = new BareClient(BARE_SERVER);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(clients.claim()));

self.addEventListener("fetch", event => {
  event.respondWith(client.fetch(event.request));
});