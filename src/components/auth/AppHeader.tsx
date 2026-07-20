"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePWA } from "@/components/pwa/PWAProvider";

type Me = { id: number; email: string | null; name?: string | null; role: string } | null;

const ME_KEY = "eh-user";

function loadCachedMe(): Me {
  try {
    const s = localStorage.getItem(ME_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function AppHeader() {
  const pathname = usePathname();
  const [me, setMe] = useState<Me>(null);
  const { isOnline, isSyncing, pendingCount, triggerSync, lastSyncAt, lastSyncResult, isInstallable, promptInstall } = usePWA();

  const [syncDone, setSyncDone] = useState(false);
  const prevSyncAt = useRef<Date | null>(null);

  useEffect(() => {
    if (!lastSyncAt) return;
    if (lastSyncAt === prevSyncAt.current) return;
    if ((lastSyncResult?.succeeded ?? 0) === 0) return;
    prevSyncAt.current = lastSyncAt;
    setSyncDone(true);
    const t = setTimeout(() => setSyncDone(false), 8000);
    return () => clearTimeout(t);
  }, [lastSyncAt, lastSyncResult]);

  // Hydrate from localStorage immediately so nav stays visible offline
  useEffect(() => {
    setMe(loadCachedMe());
  }, []);

  // Chrome can restore a page from the back/forward cache with its whole JS
  // runtime frozen and resumed as-is — mount-time effects don't re-run, so a
  // stale logged-in UI could otherwise reappear after pressing "back" past a
  // logout. A persisted pageshow means exactly that happened; force a real
  // reload so the auth check above runs again against the current session.
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        window.location.reload();
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Fetch fresh user — only update state on a real 200 response
  useEffect(() => {
    if (pathname === "/login") return;

    function checkSession() {
      fetch("/api/auth/me")
        .then(async (r) => {
          if (!r.ok) return; // offline (503) or auth error — keep cached state
          const d = await r.json();
          if (d?.user) {
            setMe(d.user);
            try { localStorage.setItem(ME_KEY, JSON.stringify(d.user)); } catch {}
            return;
          }
          // Server actively says there's no session (account deactivated or
          // removed) — drop the stale cached identity and send them to login.
          // Hard navigation (see logout() below) so the client-side route
          // cache doesn't keep serving this now-invalid page on "back".
          try { localStorage.removeItem(ME_KEY); } catch {}
          setMe(null);
          window.location.href = "/login";
        })
        .catch(() => {}); // network error — keep cached state
    }

    checkSession();
    // Also re-check periodically, not just on navigation — otherwise a user
    // deactivated while idle on a single page (never triggering a pathname
    // change) would keep its stale cached session until they happen to click
    // somewhere.
    const interval = setInterval(checkSession, 2 * 60_000);
    return () => clearInterval(interval);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    try { localStorage.removeItem(ME_KEY); } catch {}
    // Hard navigation, not router.push: this drops Next.js's in-memory
    // client-side route cache along with the whole JS runtime, so a later
    // "back" button press can't instantly restore a cached authenticated
    // page from before logout — it has to hit the server (and middleware)
    // again, which now sees no valid session.
    window.location.href = "/login";
  }

  if (pathname === "/login") return null;

  const hasPending = pendingCount > 0;
  const showSyncBtn = hasPending || isSyncing || syncDone;

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <Link href="/" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Eigen Huis
        </Link>

        <div className="flex items-center gap-3 text-sm">

          {/* ── Offline indicator ─────────────────────────────────────────────── */}
          {!isOnline && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              Offline
            </span>
          )}

          {/* ── Install button ────────────────────────────────────────────────── */}
          {/* beforeinstallprompt's default browser UI is suppressed (see the
              capture effect in PWAProvider) specifically so it can be offered
              here instead — an inspector needs the installed app, with its
              offline cache, working before they lose signal in the field. */}
          {isInstallable && (
            <button
              type="button"
              onClick={promptInstall}
              title="Installeer de app voor offline gebruik"
              className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400 sm:flex"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
              </svg>
              App installeren
            </button>
          )}

          {/* ── Sync button ───────────────────────────────────────────────────── */}
          {showSyncBtn && (
            <button
              type="button"
              onClick={syncDone ? undefined : triggerSync}
              disabled={isSyncing || (!isOnline && !syncDone) || syncDone}
              title={
                syncDone
                  ? "Wijzigingen zijn gesynchroniseerd"
                  : !isOnline
                  ? `${pendingCount} ${pendingCount === 1 ? "wijziging" : "wijzigingen"} wacht op verbinding`
                  : isSyncing
                  ? "Bezig met synchroniseren…"
                  : `${pendingCount} ${pendingCount === 1 ? "wijziging" : "wijzigingen"} synchroniseren`
              }
              className={`relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default ${
                syncDone
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-70 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
              }`}
            >
              {isSyncing ? (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : syncDone ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className="hidden sm:inline">
                {isSyncing ? "Synchroniseren…" : syncDone ? "Gesynchroniseerd" : "Synchroniseer"}
              </span>
              {!isSyncing && !syncDone && hasPending && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white dark:bg-blue-400 dark:text-blue-950">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </button>
          )}

          {/* ── Nav links — always shown when user is known (cached or live) ──── */}
          {me ? (
            <>
              <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">{me.email ?? "Gebruiker"}</span>
              <Link href="/settings" className="text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400">
                Instellingen
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
              >
                Uitloggen
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
