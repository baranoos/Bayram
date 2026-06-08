/**
 * Eigen Huis Inspectie — Service Worker
 * Offline-first PWA: caching + sync queue + background sync
 */

const SW_VERSION = 'v5';
const STATIC_CACHE  = `eigenhuis-static-${SW_VERSION}`;
const PAGES_CACHE   = `eigenhuis-pages-${SW_VERSION}`;
const API_CACHE     = `eigenhuis-api-${SW_VERSION}`;
const ALL_CACHES    = [STATIC_CACHE, PAGES_CACHE, API_CACHE];

const SYNC_TAG      = 'eigenhuis-sync';
const DB_NAME       = 'eigenhuis-offline';
const DB_VERSION    = 1;

/** URLs to pre-cache on install (app shell). */
const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.json',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
  '/icons/maskable-icon-512x512.png',
  '/icons/apple-touch-icon-180x180.png',
  '/icons/favicon.ico',
];

/**
 * Mutation patterns that can be queued when offline.
 * These are POST/PUT/PATCH/DELETE endpoints whose bodies fit in IDB.
 */
const QUEUEABLE_PATTERNS = [
  /^\/api\/opdrachten\/\d+\/gebreken$/,
  /^\/api\/opdrachten\/\d+\/woning$/,
  /^\/api\/opdrachten\/\d+\/meterstanden$/,
  /^\/api\/gebreken\/\d+$/,
];

/**
 * Patterns that MUST always go to the network (auth, uploads, binary ops).
 */
const NETWORK_ONLY_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/r2-presign/,
  /^\/api\/supabase-upload/,
  /^\/api\/uploads/,
  /^\/api\/opdrachten\/\d+\/export$/,
  /^\/api\/opdrachten\/\d+\/rapporten/,
  /^\/api\/sync/,
  /^\/api\/admin/,
];

// ─────────────────────────────────────────────────────────────────────────────
// INDEXEDDB HELPERS (inline, no importScripts needed)
// ─────────────────────────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;

      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
        store.createIndex('status',    'status',    { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains('data_cache')) {
        const ds = db.createObjectStore('data_cache', { keyPath: 'key' });
        ds.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

function idbGet(db, store, key) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function idbPut(db, store, value) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function idbGetAllByIndex(db, store, indexName, value) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).index(indexName).getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function idbGetAll(db, store) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function inferType(url) {
  if (/\/gebreken/.test(url)) return 'gebrek';
  if (/\/woning$/.test(url))  return 'woning';
  if (/\/meterstanden$/.test(url)) return 'meterstand';
  return 'mutation';
}

function inferDescription(url) {
  const opdrachtMatch = url.match(/opdrachten\/(\d+)/);
  const opdrachtId = opdrachtMatch ? opdrachtMatch[1] : '?';
  const type = inferType(url);
  const labels = { gebrek: 'Gebrek', woning: 'Woninggegevens', meterstand: 'Meterstanden', mutation: 'Wijziging' };
  return `${labels[type] || 'Wijziging'} (opdracht #${opdrachtId})`;
}

async function queueRequest(url, method, headers, body) {
  const db   = await openDB();
  const item = {
    id:          generateId(),
    url,
    method,
    headers,
    body:        body || null,
    timestamp:   Date.now(),
    status:      'pending',
    retries:     0,
    maxRetries:  5,
    type:        inferType(url),
    description: inferDescription(url),
  };
  await idbPut(db, 'sync_queue', item);
  return item;
}

async function processSyncQueue() {
  let db;
  try {
    db = await openDB();
  } catch {
    return { succeeded: 0, failed: 0 };
  }

  const items = await idbGetAllByIndex(db, 'sync_queue', 'status', 'pending');
  // Oldest first
  items.sort((a, b) => a.timestamp - b.timestamp);

  let succeeded = 0;
  let failed    = 0;

  for (const item of items) {
    if (item.retries >= item.maxRetries) {
      await idbPut(db, 'sync_queue', { ...item, status: 'failed', lastRetryAt: Date.now() });
      failed++;
      continue;
    }

    // Reconstitute safe headers (strip SW-injected / non-forwardable headers)
    const safeHeaders = {};
    const skip = new Set(['accept-encoding', 'host', 'connection', 'content-length', 'transfer-encoding']);
    for (const [k, v] of Object.entries(item.headers || {})) {
      if (!skip.has(k.toLowerCase())) safeHeaders[k] = v;
    }
    // Ensure content-type is set for JSON bodies
    if (item.body && !safeHeaders['content-type'] && !safeHeaders['Content-Type']) {
      safeHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(item.url, {
        method:  item.method,
        headers: safeHeaders,
        body:    item.body || undefined,
      });

      if (response.ok || response.status === 409) {
        // 409 Conflict = server already has this data — treat as resolved
        await idbPut(db, 'sync_queue', {
          ...item,
          status:      'completed',
          completedAt: Date.now(),
        });
        succeeded++;
      } else if (response.status >= 400 && response.status < 500) {
        // Client error (validation etc.) — mark failed, no retry
        const errorText = await response.text().catch(() => `HTTP ${response.status}`);
        await idbPut(db, 'sync_queue', {
          ...item,
          status:       'failed',
          lastError:    errorText.slice(0, 300),
          lastRetryAt:  Date.now(),
        });
        failed++;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      const retries = item.retries + 1;
      await idbPut(db, 'sync_queue', {
        ...item,
        status:      retries >= item.maxRetries ? 'failed' : 'pending',
        retries,
        lastError:   err.message,
        lastRetryAt: Date.now(),
      });
      if (retries >= item.maxRetries) failed++;
    }
  }

  // Notify all clients of sync result
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_COMPLETE', succeeded, failed });
  }

  return { succeeded, failed };
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHE STRATEGY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function offlineFallback(isAPI) {
  if (isAPI) {
    return new Response(
      JSON.stringify({ error: 'offline', message: 'Geen internetverbinding' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const offlineCache = await caches.open(STATIC_CACHE);
  const offlinePage  = await offlineCache.match('/offline.html');
  return (
    offlinePage ||
    new Response('<h1>Offline</h1>', { status: 503, headers: { 'Content-Type': 'text/html' } })
  );
}

async function networkFirst(request, cacheName, timeoutMs, isAPI = false) {
  const cache = await caches.open(cacheName);

  const networkPromise = fetch(request.clone()).then((response) => {
    if (response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  });

  try {
    if (!timeoutMs) return await networkPromise;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    );
    return await Promise.race([networkPromise, timeoutPromise]);
  } catch {
    // Exact match
    let cached = await cache.match(request);
    if (cached) return cached;

    // Ignore Vary — catches RSC request vs HTML-cached response mismatch
    cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;

    return offlineFallback(isAPI);
  }
}

async function networkFirstNavigation(request) {
  // Absolute bare pathname — used as canonical cache key so any RSC request
  // (which Next.js decorates with ?_rsc=<hash> that changes every navigation)
  // can always be found by the same stable URL.
  const bareUrl = self.location.origin + new URL(request.url).pathname;

  const cache = await caches.open(PAGES_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Store under the original request AND under the bare pathname so that
      // offline lookups with a different ?_rsc= hash still find this page.
      cache.put(request, response.clone()).catch(() => {});
      cache.put(bareUrl, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    // 1. Exact match
    let cached = await cache.match(request);
    if (cached) return cached;

    // 2. Ignore Vary — catches header mismatches (RSC vs full-page request)
    cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;

    // 3. Bare absolute pathname — strips ?_rsc=<hash> and other query params
    cached = await cache.match(bareUrl, { ignoreVary: true });
    if (cached) return cached;

    return offlineFallback(false);
  }
}

async function handleQueueableMutation(request) {
  // Clone before reading body (can only be consumed once)
  const clonedForNetwork = request.clone();

  try {
    const response = await fetch(clonedForNetwork);
    return response;
  } catch {
    // Network failed — queue for background sync
    let body = null;
    try {
      body = await request.text();
    } catch {
      // Body not readable
    }

    const headers = {};
    request.headers.forEach((value, key) => { headers[key] = value; });

    const item = await queueRequest(request.url, request.method, headers, body);

    return new Response(
      JSON.stringify({
        queued:  true,
        id:      item.id,
        message: 'Opgeslagen voor synchronisatie zodra verbinding terugkomt',
      }),
      {
        status: 202,
        headers: {
          'Content-Type':    'application/json',
          'X-Offline-Queue': 'true',
        },
      }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LIFECYCLE EVENTS
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete stale caches from previous SW versions
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => !ALL_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim(),
    ])
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FETCH HANDLER
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();

  // Ignore non-HTTP(S) requests (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // ── 1. Immutable Next.js build artifacts ──────────────────────────────────
  if (pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── 2. Static public files (icons, manifest, offline page, favicons) ──────
  if (
    pathname.startsWith('/icons/') ||
    pathname === '/manifest.json' ||
    pathname === '/offline.html' ||
    pathname.match(/\.(ico|png|svg|webp|jpg|jpeg|gif|woff2?|ttf|otf)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── 3. Network-only (auth, uploads, binary generation) ────────────────────
  if (NETWORK_ONLY_PATTERNS.some((p) => p.test(pathname))) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // ── 4. Queueable mutations (offline queue support) ─────────────────────────
  if (method !== 'GET' && method !== 'HEAD') {
    if (QUEUEABLE_PATTERNS.some((p) => p.test(pathname))) {
      event.respondWith(handleQueueableMutation(request));
      return;
    }
    // Other mutations: try network, return 503 JSON if offline
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'offline', message: 'Geen verbinding. Probeer opnieuw als je online bent.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // ── 5. Next.js RSC data fetches (/_next/data/) ────────────────────────────
  if (pathname.startsWith('/_next/data/')) {
    event.respondWith(networkFirst(request, PAGES_CACHE, 5000));
    return;
  }

  // ── 6. GET API requests — network-first with cache fallback ───────────────
  if (pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE, 5000, true));
    return;
  }

  // ── 7. Page navigations (HTML) + Next.js App Router RSC client navigation ──
  // Next.js App Router soft-navigation sends RSC: 1 or Next-Router-State-Tree
  // headers. These are same-origin fetches (not mode:navigate) but still need
  // the page-navigation cache strategy with ignoreVary so precached HTML can
  // be served even when the request has Vary-triggering headers.
  if (
    request.mode === 'navigate' ||
    request.headers.get('RSC') === '1' ||
    request.headers.has('Next-Router-State-Tree')
  ) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // ── 8. Everything else — network with page-cache fallback ─────────────────
  event.respondWith(networkFirst(request, PAGES_CACHE, 5000));
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND SYNC
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(processSyncQueue());
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data?.type) return;

  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'TRIGGER_SYNC':
      processSyncQueue().catch(() => {});
      break;

    case 'GET_SYNC_STATUS':
      openDB()
        .then((db) => idbGetAll(db, 'sync_queue'))
        .then((items) => {
          const pending   = items.filter((i) => i.status === 'pending').length;
          const failed    = items.filter((i) => i.status === 'failed').length;
          const completed = items.filter((i) => i.status === 'completed').length;
          event.source?.postMessage({ type: 'SYNC_STATUS', pending, failed, completed });
        })
        .catch(() => {});
      break;

    case 'CACHE_API_RESPONSE':
      if (data.url && data.payload !== undefined) {
        openDB()
          .then((db) => idbPut(db, 'data_cache', {
            key:      data.url,
            data:     data.payload,
            cachedAt: Date.now(),
          }))
          .catch(() => {});
      }
      break;

    case 'PRECACHE_PAGES': {
      const pageUrls = Array.isArray(data.pageUrls) ? data.pageUrls : [];
      const apiUrls  = Array.isArray(data.apiUrls)  ? data.apiUrls  : [];

      if (pageUrls.length === 0 && apiUrls.length === 0) break;

      event.waitUntil(
        (async () => {
          const [pageCache, apiCache] = await Promise.all([
            caches.open(PAGES_CACHE),
            caches.open(API_CACHE),
          ]);

          // Concurrency-limited fetch helper — avoids flooding the server
          async function fetchAndCache(urls, cache) {
            const BATCH = 4;
            for (let i = 0; i < urls.length; i += BATCH) {
              const batch = urls.slice(i, i + BATCH);
              await Promise.all(
                batch.map(async (url) => {
                  try {
                    // Skip if already cached (avoid redundant round-trips)
                    const existing = await cache.match(url);
                    if (existing) return;

                    const response = await fetch(url, { credentials: 'include' });
                    if (response.ok) {
                      await cache.put(url, response);
                    }
                  } catch {
                    // Network failure — page will be fetched on demand later
                  }
                })
              );
            }
          }

          await Promise.all([
            fetchAndCache(pageUrls, pageCache),
            fetchAndCache(apiUrls,  apiCache),
          ]);

          // Notify clients that precaching finished
          const clients = await self.clients.matchAll({ includeUncontrolled: true });
          for (const client of clients) {
            client.postMessage({ type: 'PRECACHE_COMPLETE', count: pageUrls.length + apiUrls.length });
          }
        })()
      );
      break;
    }

    // ── Full keuring tree — write every keuring-children response into cache ──
    // The client fetches /api/keuring-tree (one request) and posts the result
    // here. We synthetically populate the API cache with every parentId's
    // children so selectNode() can work fully offline without network calls.
    case 'PRECACHE_KEURING_TREE': {
      const tree = data.tree;
      if (!tree || typeof tree !== 'object') break;

      event.waitUntil(
        (async () => {
          const cache = await caches.open(API_CACHE);

          await Promise.all(
            Object.entries(tree).map(([parentId, children]) => {
              const url      = `/api/keuring-children?id=${parentId}`;
              const response = new Response(JSON.stringify(children), {
                status:  200,
                headers: { 'Content-Type': 'application/json', 'X-SW-Precached': 'keuring-tree' },
              });
              return cache.put(url, response);
            })
          );

          const clients = await self.clients.matchAll({ includeUncontrolled: true });
          for (const client of clients) {
            client.postMessage({
              type:  'KEURING_TREE_CACHED',
              count: Object.keys(tree).length,
            });
          }
        })()
      );
      break;
    }

    default:
      break;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS (future-ready stub)
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    event.waitUntil(
      self.registration.showNotification(payload.title || 'Eigen Huis', {
        body:    payload.body || '',
        icon:    '/icons/icon-192.svg',
        badge:   '/icons/icon-192.svg',
        tag:     payload.tag || 'default',
        data:    payload.data || {},
      })
    );
  } catch {
    // Non-JSON push — ignore
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
