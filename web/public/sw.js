/**
 * Kaa service worker.
 *
 * One job: a cold launch on no signal should open something rather than a
 * browser error. It holds the entry screen and the offline page, and nothing
 * else.
 *
 * Navigations are network-first and are **not** cached. Every screen under
 * /app is personalised now — what a member sees is not what a free user sees,
 * and neither is what a signed-out person should see. A cached page served to
 * the next person on the handset would hand them somebody else's view, which
 * is exactly what the redaction boundary exists to prevent. A stale listing
 * price is no better. So the network answers, or the shell does.
 */

// Bump this on any change to the shell list or the caching rules. The activate
// handler deletes every cache that does not start with it, which is what makes
// a deploy actually reach a handset that already has the old one.
const VERSION = "kaa-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

/**
 * `/app/welcome`, not `/app`. `/app` answers with a redirect for anyone
 * without an account, and a redirected response cannot go into a Cache — it
 * takes `addAll` down with it, and `addAll` is atomic, so the whole install
 * fails and the app stops being installable at all.
 */
const SHELL = ["/app/welcome", "/offline", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Individually rather than addAll, so one entry failing — a renamed
      // icon, a route that moved — costs that entry and not the install.
      Promise.all(
        SHELL.map((path) =>
          fetch(path, { cache: "reload" })
            .then((response) => (response.ok && !response.redirected ? cache.put(path, response) : undefined))
            .catch(() => undefined),
        ),
      ).then(() => self.skipWaiting()),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache the API. A cached availability, price or membership is a lie.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const shell = url.pathname.startsWith("/app")
          ? await caches.match("/app/welcome")
          : undefined;
        return shell || (await caches.match("/offline")) || Response.error();
      }),
    );
    return;
  }

  // Static assets only. Next.js fingerprints these, so a cached one is either
  // current or unreachable — it can never be a stale version of a live URL.
  if (!url.pathname.startsWith("/_next/static/") && !/\.(png|svg|webmanifest|woff2?)$/.test(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && !response.redirected) {
            const copy = response.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
