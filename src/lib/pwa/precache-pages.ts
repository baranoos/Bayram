/**
 * Page precaching — warms the SW cache with all important pages for the
 * current user so they load instantly (and work offline) after the first visit.
 *
 * Strategy:
 *  - Runs once per browser session (sessionStorage flag).
 *  - Fetches /api/opdrachten for the list of IDs.
 *  - Sends a PRECACHE_PAGES message to the active service worker.
 *  - The SW fetches each URL in the background and stores them in its caches.
 */

const SESSION_KEY = "pwa-cache-warmed";

const STATIC_PAGES = ["/", "/opdracht/nieuw"];

const OPDRACHT_PAGES = [
  "details",
  "keuring",
  "woning",
  "meterstanden",
  "overzicht",
  "rapporten",
];

const OPDRACHT_API = ["woning", "meterstanden"];

export async function warmCacheForCurrentUser(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!navigator.onLine) return;
  if (!("serviceWorker" in navigator)) return;

  // Only once per session — avoids hammering the server on every navigation
  if (sessionStorage.getItem(SESSION_KEY)) return;

  try {
    // Wait for an active SW
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) return;

    // Fetch the list of recent opdrachten
    const res = await fetch("/api/opdrachten?limit=20");
    if (!res.ok) return;

    const { opdrachten } = (await res.json()) as { opdrachten: { id: number }[] };
    const ids = opdrachten.map((o) => o.id);

    // Build URL lists
    const pageUrls: string[] = [
      ...STATIC_PAGES,
      ...ids.flatMap((id) =>
        OPDRACHT_PAGES.map((seg) => `/opdracht/${id}/${seg}`)
      ),
    ];

    const apiUrls: string[] = [
      "/api/keuring-children?id=1", // root of the keuring tree
      ...ids.flatMap((id) =>
        OPDRACHT_API.map((resource) => `/api/opdrachten/${id}/${resource}`)
      ),
    ];

    // Delegate fetching + caching to the SW (runs off the main thread)
    reg.active.postMessage({ type: "PRECACHE_PAGES", pageUrls, apiUrls });

    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Non-critical — ignore silently
  }
}
