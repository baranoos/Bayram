"use client";

import { usePWA } from "./PWAProvider";

/**
 * Thin top banner that appears when a new service worker version is waiting.
 * Prompts the user to reload so they get the latest app version.
 */
export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = usePWA();

  if (!updateAvailable) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 bg-blue-600 px-4 py-2 text-sm text-white"
    >
      <span>Nieuwe versie beschikbaar.</span>
      <button
        type="button"
        onClick={applyUpdate}
        className="shrink-0 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20"
      >
        Nu bijwerken
      </button>
    </div>
  );
}
