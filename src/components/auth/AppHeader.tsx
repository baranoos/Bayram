"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePWA } from "@/components/pwa/PWAProvider";

type Me = { id: number; email: string | null; role: string } | null;

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);
  const { isOnline, isSyncing, pendingCount, triggerSync } = usePWA();

  useEffect(() => {
    if (pathname === "/login") return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (pathname === "/login") {
    return null;
  }

  const hasPending = pendingCount > 0;

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <Link href="/" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Eigen Huis
        </Link>

        <div className="flex items-center gap-3 text-sm">

          {/* ── Offline indicator ───────────────────────────────────────────── */}
          {!isOnline && (
            <span className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              Offline
            </span>
          )}

          {/* ── Sync button (shown when pending items exist) ─────────────────── */}
          {(hasPending || isSyncing) && (
            <button
              type="button"
              onClick={triggerSync}
              disabled={isSyncing || !isOnline}
              title={
                !isOnline
                  ? `${pendingCount} ${pendingCount === 1 ? "wijziging" : "wijzigingen"} wacht op verbinding`
                  : isSyncing
                  ? "Bezig met synchroniseren…"
                  : `${pendingCount} ${pendingCount === 1 ? "wijziging" : "wijzigingen"} synchroniseren`
              }
              className="relative flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              {isSyncing ? (
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}

              <span className="hidden sm:inline">
                {isSyncing ? "Synchroniseren…" : "Synchroniseer"}
              </span>

              {/* Badge with pending count */}
              {!isSyncing && hasPending && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white dark:bg-blue-400 dark:text-blue-950">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </button>
          )}

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
