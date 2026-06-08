/**
 * Page & data precaching — warms the SW cache with all important pages and
 * API responses for the current user so everything works offline after one
 * online session.
 *
 * Strategy:
 *  - Each warm function runs once per browser session (separate localStorage flags).
 *  - warmCacheForCurrentUser: caches all opdracht pages + woning/meterstanden APIs.
 *  - warmKeuringTree: fetches the ENTIRE keuring tree in one request and writes
 *    every /api/keuring-children?id=X response into the SW cache synthetically,
 *    so the full tree is navigable offline without any extra network calls.
 */

// Keep in sync with SW_VERSION in public/sw.js — change forces a re-warm
const SESSION_KEY        = "pwa-cache-warmed-v4";
// Independent version for the keuring tree data
const KEURING_SESSION_KEY = "pwa-keuring-tree-v1";

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

  if (localStorage.getItem(SESSION_KEY) === "1") return;

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) return;

    const res = await fetch("/api/opdrachten?limit=20");
    if (!res.ok) return;

    const { opdrachten } = (await res.json()) as { opdrachten: { id: number }[] };
    const ids = opdrachten.map((o) => o.id);

    const pageUrls: string[] = [
      ...STATIC_PAGES,
      ...ids.flatMap((id) =>
        OPDRACHT_PAGES.map((seg) => `/opdracht/${id}/${seg}`)
      ),
    ];

    const apiUrls: string[] = [
      ...ids.flatMap((id) =>
        OPDRACHT_API.map((resource) => `/api/opdrachten/${id}/${resource}`)
      ),
    ];

    reg.active.postMessage({ type: "PRECACHE_PAGES", pageUrls, apiUrls });
    localStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Non-critical
  }
}

/**
 * Downloads the entire keuring tree in one request and sends it to the SW,
 * which synthetically populates /api/keuring-children?id=X for every node.
 * After this runs, the complete keuring tree is navigable offline.
 */
export async function warmKeuringTree(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!navigator.onLine) return;
  if (!("serviceWorker" in navigator)) return;

  if (localStorage.getItem(KEURING_SESSION_KEY) === "1") return;

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) return;

    const res = await fetch("/api/keuring-tree");
    if (!res.ok) return;

    const { tree } = (await res.json()) as {
      tree: Record<number, { id: number; omschrijving: string; hasChildren: boolean }[]>;
    };

    reg.active.postMessage({ type: "PRECACHE_KEURING_TREE", tree });
    localStorage.setItem(KEURING_SESSION_KEY, "1");
  } catch {
    // Non-critical
  }
}
