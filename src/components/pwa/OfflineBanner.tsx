"use client";

import { useEffect, useState } from "react";
import { usePWA } from "./PWAProvider";

/**
 * Fixed-position toast that shows:
 *  - Amber: offline (with pending count)
 *  - Blue spinner: actively syncing
 *  - Green: sync succeeded (auto-dismiss after 4 s)
 *  - Red: sync had failures
 *  - Grey: online but items still pending
 */
export function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount, lastSyncResult } = usePWA();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);

  // Auto-dismiss success banner after 4 s
  useEffect(() => {
    if (!lastSyncResult) return;

    if (lastSyncResult.succeeded > 0) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [lastSyncResult]);

  // Show failure banner for 6 s
  useEffect(() => {
    if (!lastSyncResult) return;

    if (lastSyncResult.failed > 0) {
      setShowFailure(true);
      const t = setTimeout(() => setShowFailure(false), 6000);
      return () => clearTimeout(t);
    }
  }, [lastSyncResult]);

  // Nothing to show
  if (isOnline && !isSyncing && !showSuccess && !showFailure && pendingCount === 0) {
    return null;
  }

  // ── Offline ────────────────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <Banner color="amber">
        <Dot color="bg-amber-500 dark:bg-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Geen internetverbinding
          </p>
          {pendingCount > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {pendingCount} {pendingCount === 1 ? "wijziging" : "wijzigingen"} worden
              opgeslagen en gesynchroniseerd zodra verbinding terugkomt.
            </p>
          )}
        </div>
      </Banner>
    );
  }

  // ── Syncing ────────────────────────────────────────────────────────────────
  if (isSyncing) {
    return (
      <Banner color="blue">
        <Spinner />
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Offline wijzigingen synchroniseren…
        </p>
      </Banner>
    );
  }

  // ── Sync succeeded ─────────────────────────────────────────────────────────
  if (showSuccess && lastSyncResult && lastSyncResult.succeeded > 0) {
    return (
      <Banner color="emerald">
        <Dot color="bg-emerald-500 dark:bg-emerald-400" />
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
          {lastSyncResult.succeeded}{" "}
          {lastSyncResult.succeeded === 1 ? "wijziging" : "wijzigingen"} gesynchroniseerd
          {lastSyncResult.failed > 0 ? ` — ${lastSyncResult.failed} mislukt` : ""}
        </p>
      </Banner>
    );
  }

  // ── Sync failures ──────────────────────────────────────────────────────────
  if (showFailure && lastSyncResult && lastSyncResult.failed > 0 && lastSyncResult.succeeded === 0) {
    return (
      <Banner color="red">
        <Dot color="bg-red-500 dark:bg-red-400" />
        <div>
          <p className="text-sm font-semibold text-red-900 dark:text-red-100">
            Synchronisatie mislukt
          </p>
          <p className="text-xs text-red-700 dark:text-red-300">
            {lastSyncResult.failed} {lastSyncResult.failed === 1 ? "wijziging" : "wijzigingen"} konden
            niet worden verstuurd. Wordt automatisch opnieuw geprobeerd.
          </p>
        </div>
      </Banner>
    );
  }

  // ── Pending but online (e.g. just came online, sync not started yet) ───────
  if (pendingCount > 0) {
    return (
      <Banner color="slate">
        <Dot color="bg-slate-400 dark:bg-slate-500" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {pendingCount} {pendingCount === 1 ? "wijziging" : "wijzigingen"} wacht op synchronisatie…
        </p>
      </Banner>
    );
  }

  return null;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

type Color = "amber" | "blue" | "emerald" | "red" | "slate";

const borderMap: Record<Color, string> = {
  amber:   "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
  blue:    "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
  emerald: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
  red:     "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  slate:   "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800",
};

function Banner({ children, color }: { children: React.ReactNode; color: Color }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border px-4 py-3 shadow-lg ${borderMap[color]}`}
    >
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />;
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
