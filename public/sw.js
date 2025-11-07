/* eslint-disable */

importScripts("/uv/uv.bundle.js");
importScripts("/uv/uv.sw.js");
importScripts("/uv/uv.config.js");

// Strictly use the new bundle for testing (no legacy fallback)
importScripts(
  "/new-scram/scramjet.all.js?v=2",
  "/new-scram/scramjet.sync.js?v=2"
);

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
