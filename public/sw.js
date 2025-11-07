/* eslint-disable */

importScripts("/uv/uv.bundle.js");
importScripts("/uv/uv.sw.js");
importScripts("/uv/uv.config.js");

// Scramjet bundle shim
try { self.unknown = self.unknown || {}; } catch (e) {}
// Prefer new bundle; if it doesn't expose ScramjetServiceWorker (packaging diff), fall back to legacy pieces
try {
  importScripts(
    "/new-scram/scramjet.all.js?v=3",
    "/new-scram/scramjet.sync.js?v=3"
  );
  try { console.info('[scramjet] new bundle imported (v=3)'); } catch(e) {}
} catch (e) {
  try { console.warn('[scramjet] failed to import new bundle, falling back to legacy', e); } catch(_) {}
}
if (typeof self.ScramjetServiceWorker !== 'function') {
  try {
    importScripts(
      "/scram/scramjet.wasm.js",
      "/scram/scramjet.shared.js",
      "/scram/scramjet.worker.js"
    );
    try { console.info('[scramjet] legacy worker imported'); } catch(e) {}
  } catch (e) {
    try { console.error('[scramjet] failed to import legacy worker', e); } catch(_) {}
  }
}

uv = new UVServiceWorker();
const scramjet = new ScramjetServiceWorker();
async function handleRequest(event) {
  // console.log(event);
  const orig = event.request;

  await scramjet.loadConfig();

  if (orig.url.startsWith(location.origin + __uv$config.prefix)) {
    return uv.fetch(event);
  } else if (scramjet.route(event)) {
    return scramjet.fetch(event);
  }

  return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});
