/**
 * Client-side sync queue management.
 * Enqueues offline mutations in IndexedDB and processes them when online.
 */

import {
  type SyncQueueItem,
  sqPut,
  sqGetByStatus,
  sqGetAll,
  sqClearCompleted,
  sqCount,
} from './idb';

export type { SyncQueueItem };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Register for Background Sync API (best-effort, falls back silently). */
async function registerBackgroundSync(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await (reg as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register('eigenhuis-sync');
  } catch {
    // Background Sync unavailable — online-event fallback handles it
  }
}

// ─── Enqueue ──────────────────────────────────────────────────────────────────

export interface EnqueueOptions {
  url:          string;
  method:       string;
  headers?:     Record<string, string>;
  body:         string | null;
  type:         string;
  description:  string;
  opdrachtId?:  number;
}

export async function enqueueRequest(options: EnqueueOptions): Promise<SyncQueueItem> {
  const item: SyncQueueItem = {
    id:          generateId(),
    url:         options.url,
    method:      options.method,
    headers:     { 'Content-Type': 'application/json', ...options.headers },
    body:        options.body,
    timestamp:   Date.now(),
    status:      'pending',
    retries:     0,
    maxRetries:  5,
    type:        options.type,
    description: options.description,
    opdrachtId:  options.opdrachtId,
  };

  await sqPut(item);
  await registerBackgroundSync();

  return item;
}

// ─── Processor ────────────────────────────────────────────────────────────────

export interface SyncResult {
  processed:  number;
  succeeded:  number;
  failed:     number;
  errors:     string[];
}

export async function processSyncQueue(): Promise<SyncResult> {
  const result: SyncResult = { processed: 0, succeeded: 0, failed: 0, errors: [] };

  let items: SyncQueueItem[];
  try {
    items = await sqGetByStatus('pending');
  } catch {
    return result;
  }

  // Process oldest first to maintain ordering
  items.sort((a, b) => a.timestamp - b.timestamp);

  for (const item of items) {
    result.processed++;

    if (item.retries >= item.maxRetries) {
      await sqPut({ ...item, status: 'failed', lastRetryAt: Date.now() });
      result.failed++;
      result.errors.push(`${item.description}: maximale pogingen bereikt`);
      continue;
    }

    // Strip headers that cannot be forwarded
    const safeHeaders: Record<string, string> = {};
    const blocked = new Set(['accept-encoding', 'host', 'connection', 'content-length', 'transfer-encoding']);
    for (const [k, v] of Object.entries(item.headers)) {
      if (!blocked.has(k.toLowerCase())) safeHeaders[k] = v;
    }

    try {
      const response = await fetch(item.url, {
        method:  item.method,
        headers: safeHeaders,
        body:    item.body ?? undefined,
      });

      if (response.ok) {
        await sqPut({ ...item, status: 'completed', completedAt: Date.now() });
        result.succeeded++;

      } else if (response.status === 409) {
        // Conflict = server already processed this or has newer data → resolved
        await sqPut({ ...item, status: 'completed', completedAt: Date.now() });
        result.succeeded++;

      } else if (response.status >= 400 && response.status < 500) {
        // Permanent client error — mark failed, stop retrying
        const text = await response.text().catch(() => `HTTP ${response.status}`);
        await sqPut({
          ...item,
          status:      'failed',
          lastError:   text.slice(0, 300),
          lastRetryAt: Date.now(),
        });
        result.failed++;
        result.errors.push(`${item.description}: ${text.slice(0, 120)}`);

      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (err) {
      const retries  = item.retries + 1;
      const errorMsg = err instanceof Error ? err.message : 'Netwerk fout';
      const nextStatus = retries >= item.maxRetries ? 'failed' : 'pending';

      await sqPut({
        ...item,
        status:      nextStatus,
        retries,
        lastError:   errorMsg,
        lastRetryAt: Date.now(),
      });

      if (nextStatus === 'failed') {
        result.failed++;
        result.errors.push(`${item.description}: na ${retries} pogingen mislukt`);
      }
    }
  }

  // House-keeping: delete completed items older than 24 h
  await sqClearCompleted().catch(() => {});

  return result;
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export async function getPendingCount(): Promise<number> {
  try {
    return await sqCount('pending');
  } catch {
    return 0;
  }
}

export async function getFailedCount(): Promise<number> {
  try {
    return await sqCount('failed');
  } catch {
    return 0;
  }
}

export async function getAllQueueItems(): Promise<SyncQueueItem[]> {
  try {
    return await sqGetAll();
  } catch {
    return [];
  }
}
