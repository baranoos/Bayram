"use client";

import { useEffect, useState } from "react";
import { usePWA } from "./PWAProvider";

/**
 * Compact pill-shaped status indicator fixed in the top-right corner (below
 * the header). Deliberately small so it never obscures form actions at the
 * bottom of the viewport on mobile.
 *
 * States: offline · offline + pending count · syncing · success · failure
 */
export function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount, failedCount, lastSyncResult, retryFailedItems } = usePWA();
  const [showSuccess, setShowSuccess] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!lastSyncResult || lastSyncResult.succeeded === 0) return;
    setShowSuccess(true);
    const t = setTimeout(() => setShowSuccess(false), 4000);
    return () => clearTimeout(t);
  }, [lastSyncResult]);

  // Offline state is shown in AppHeader — only show sync-related states here.
  // failedCount is checked here (not just the transient lastSyncResult) so
  // this stays visible across reloads/navigation until the user acts on it —
  // nothing in this app ever retries a failed item on its own.
  if (!isSyncing && !showSuccess && failedCount === 0 && (isOnline ? pendingCount === 0 : true)) {
    return null;
  }

  if (isSyncing) {
    return (
      <Pill color="blue">
        <Spinner />
        <span>Synchroniseren…</span>
      </Pill>
    );
  }

  if (showSuccess && lastSyncResult && lastSyncResult.succeeded > 0 && failedCount === 0) {
    return (
      <Pill color="emerald">
        <CheckIcon />
        <span>
          {lastSyncResult.succeeded}{" "}
          {lastSyncResult.succeeded === 1 ? "wijziging" : "wijzigingen"} gesynchroniseerd
        </span>
      </Pill>
    );
  }

  // Permanently failed — nothing in the sync queue ever retries these on its
  // own, so this stays up (not a 6-second toast) and offers a real fix.
  if (failedCount > 0) {
    return (
      <Pill color="red">
        <Dot className="bg-red-500 dark:bg-red-400" />
        <span>
          {failedCount} {failedCount === 1 ? "wijziging" : "wijzigingen"} niet gesynchroniseerd
        </span>
        <button
          type="button"
          onClick={async () => {
            setRetrying(true);
            try {
              await retryFailedItems();
            } finally {
              setRetrying(false);
            }
          }}
          disabled={retrying || !isOnline}
          className="shrink-0 rounded-full border border-red-300 bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-red-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200"
        >
          {retrying ? "Bezig…" : "Opnieuw"}
        </button>
      </Pill>
    );
  }

  if (pendingCount > 0) {
    return (
      <Pill color="slate">
        <Dot className="bg-slate-400 dark:bg-slate-500" />
        <span>{pendingCount} wacht op sync</span>
      </Pill>
    );
  }

  return null;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

type Color = "amber" | "blue" | "emerald" | "red" | "slate";

const pillColors: Record<Color, string> = {
  amber:   "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  blue:    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  red:     "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  slate:   "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function Pill({ children, color }: { children: React.ReactNode; color: Color }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-3 top-14 z-40 flex max-w-55 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-sm ${pillColors[color]}`}
    >
      {children}
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${className}`} />;
}

function CheckIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-3 w-3 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
