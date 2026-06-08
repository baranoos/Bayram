"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  processSyncQueue,
  getPendingCount,
  enqueueRequest,
  type EnqueueOptions,
  type SyncQueueItem,
  type SyncResult,
} from "@/lib/pwa/sync-queue";
import { warmCacheForCurrentUser, warmKeuringTree } from "@/lib/pwa/precache-pages";

// ─── Context shape ────────────────────────────────────────────────────────────

interface PWAContextValue {
  /** Whether the browser currently has network access. */
  isOnline: boolean;
  /** True while the sync queue is being flushed. */
  isSyncing: boolean;
  /** Number of mutations waiting to be sent to the server. */
  pendingCount: number;
  /** Timestamp of the last completed sync run. */
  lastSyncAt: Date | null;
  /** Result summary of the last sync run. */
  lastSyncResult: Pick<SyncResult, "succeeded" | "failed"> | null;
  /** Add a mutation to the offline queue. */
  enqueue: (options: EnqueueOptions) => Promise<SyncQueueItem>;
  /** Flush the pending queue now (no-op when offline). */
  triggerSync: () => Promise<void>;
  /** True when the browser has a deferred install prompt available. */
  isInstallable: boolean;
  /** Show the native "Add to Home Screen" prompt. */
  promptInstall: () => void;
  /** True when a new service worker version has been installed and is waiting. */
  updateAvailable: boolean;
  /** Tell the waiting SW to activate, then reload the page. */
  applyUpdate: () => void;
}

const PWAContext = createContext<PWAContextValue | null>(null);

export function usePWA(): PWAContextValue {
  const ctx = useContext(PWAContext);
  if (!ctx) throw new Error("usePWA must be used inside <PWAProvider>");
  return ctx;
}

// ─── BeforeInstallPromptEvent (not in lib.dom.d.ts) ──────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline,        setIsOnline       ] = useState(true);
  const [isSyncing,       setIsSyncing      ] = useState(false);
  const [pendingCount,    setPendingCount   ] = useState(0);
  const [lastSyncAt,      setLastSyncAt     ] = useState<Date | null>(null);
  const [lastSyncResult,  setLastSyncResult ] = useState<Pick<SyncResult, "succeeded" | "failed"> | null>(null);
  const [isInstallable,   setIsInstallable  ] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const syncLock        = useRef(false);
  const deferredPrompt  = useRef<BeforeInstallPromptEvent | null>(null);
  const waitingWorker   = useRef<ServiceWorker | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IDB unavailable (private-browsing, storage quota, etc.) — ignore
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (syncLock.current || (typeof navigator !== "undefined" && !navigator.onLine)) return;

    syncLock.current = true;
    setIsSyncing(true);

    try {
      const result = await processSyncQueue();
      setLastSyncAt(new Date());
      setLastSyncResult({ succeeded: result.succeeded, failed: result.failed });
      await refreshPendingCount();
    } catch {
      // Sync errors are handled per-item inside processSyncQueue
    } finally {
      syncLock.current = false;
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  const enqueue = useCallback(
    async (options: EnqueueOptions) => {
      const item = await enqueueRequest(options);
      await refreshPendingCount();
      return item;
    },
    [refreshPendingCount]
  );

  const promptInstall = useCallback(() => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    prompt.prompt();
    prompt.userChoice
      .then(() => {
        deferredPrompt.current = null;
        setIsInstallable(false);
      })
      .catch(() => {});
  }, []);

  const applyUpdate = useCallback(() => {
    const sw = waitingWorker.current;
    if (sw) {
      sw.postMessage({ type: "SKIP_WAITING" });
    }
    // Reload once the new SW has taken control
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    }, { once: true });
  }, []);

  // ── Service worker registration ────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Watch for a newly installed SW waiting to activate
        const onUpdateFound = () => {
          const nextWorker = reg.installing;
          if (!nextWorker) return;
          nextWorker.addEventListener("statechange", () => {
            if (nextWorker.state === "installed" && navigator.serviceWorker.controller) {
              waitingWorker.current = nextWorker;
              setUpdateAvailable(true);
              window.dispatchEvent(new CustomEvent("pwa-update-available"));
            }
          });
        };
        reg.addEventListener("updatefound", onUpdateFound);

        // Catch the case where a SW is already waiting (e.g. page reloaded
        // while an update was pending)
        if (reg.waiting && navigator.serviceWorker.controller) {
          waitingWorker.current = reg.waiting;
          setUpdateAvailable(true);
        }
      })
      .catch((err) => {
        // SW registration failure is non-fatal; app still works online
        console.warn("[PWA] Service worker registration failed:", err);
      });

    // Messages from the SW
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        setLastSyncAt(new Date());
        setLastSyncResult({
          succeeded: event.data.succeeded ?? 0,
          failed:    event.data.failed    ?? 0,
        });
        refreshPendingCount();
      }
      // PRECACHE_COMPLETE is informational — no UI action needed
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [refreshPendingCount]);

  // ── Online / offline detection ─────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    // Hydrate from current browser state
    setIsOnline(navigator.onLine);

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync]);

  // ── Mount-time sync flush + page cache warming ────────────────────────────

  useEffect(() => {
    refreshPendingCount();
    if (typeof navigator !== "undefined" && navigator.onLine) {
      triggerSync();
      // Warm the SW cache with all important pages (once per session, in background)
      navigator.serviceWorker?.ready
        .then(() => warmCacheForCurrentUser())
        .catch(() => {});
      // Cache the full keuring tree so every level is navigable offline
      navigator.serviceWorker?.ready
        .then(() => warmKeuringTree())
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // ── Install prompt capture ─────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (ev: Event) => {
      ev.preventDefault();
      deferredPrompt.current = ev as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ── Periodic pending count refresh (every 30s) ─────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => refreshPendingCount(), 30_000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncAt,
        lastSyncResult,
        enqueue,
        triggerSync,
        isInstallable,
        promptInstall,
        updateAvailable,
        applyUpdate,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}
