/**
 * Typed IndexedDB wrapper for Eigen Huis offline storage.
 * Uses raw IDB API (no extra deps) with Promise wrappers.
 */

const DB_NAME    = 'eigenhuis-offline';
const DB_VERSION = 1;

// ─── Schema types ─────────────────────────────────────────────────────────────

export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SyncQueueItem {
  id:           string;
  url:          string;
  method:       string;
  headers:      Record<string, string>;
  body:         string | null;
  timestamp:    number;
  status:       SyncStatus;
  retries:      number;
  maxRetries:   number;
  lastError?:   string;
  lastRetryAt?: number;
  completedAt?: number;
  claimedAt?:   number;
  type:         string;
  description:  string;
  opdrachtId?:  number;
}

export interface DataCacheEntry {
  key:        string;
  data:       unknown;
  cachedAt:   number;
  expiresAt?: number;
}

// ─── DB singleton ─────────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;
let _opening: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  if (_opening) return _opening;

  _opening = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
        store.createIndex('status',    'status',    { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type',      'type',      { unique: false });
      }

      if (!db.objectStoreNames.contains('data_cache')) {
        const ds = db.createObjectStore('data_cache', { keyPath: 'key' });
        ds.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };

    req.onsuccess = () => {
      _db = req.result;

      // Reset singleton if connection closes unexpectedly
      _db.onclose = () => { _db = null; _opening = null; };
      _db.onerror = () => { _db = null; _opening = null; };

      resolve(_db);
    };

    req.onerror = () => {
      _opening = null;
      reject(req.error);
    };
  });

  return _opening;
}

// ─── Generic IDB helpers ──────────────────────────────────────────────────────

function req<T>(idbReq: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    idbReq.onsuccess = () => resolve(idbReq.result);
    idbReq.onerror   = () => reject(idbReq.error);
  });
}

// ─── sync_queue operations ────────────────────────────────────────────────────

export async function sqPut(item: SyncQueueItem): Promise<void> {
  const db    = await getDB();
  const tx    = db.transaction('sync_queue', 'readwrite');
  await req(tx.objectStore('sync_queue').put(item));
}

export async function sqGet(id: string): Promise<SyncQueueItem | undefined> {
  const db = await getDB();
  const tx = db.transaction('sync_queue', 'readonly');
  return req(tx.objectStore('sync_queue').get(id));
}

export async function sqGetAll(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const tx = db.transaction('sync_queue', 'readonly');
  return req(tx.objectStore('sync_queue').getAll());
}

export async function sqGetByStatus(status: SyncStatus): Promise<SyncQueueItem[]> {
  const db    = await getDB();
  const tx    = db.transaction('sync_queue', 'readonly');
  const index = tx.objectStore('sync_queue').index('status');
  return req(index.getAll(status));
}

/**
 * Atomically transitions an item from 'pending' (or a 'processing' item
 * abandoned by a crashed/killed tab past `staleAfterMs`) to 'processing'.
 *
 * The page and the service worker both process this same queue from separate
 * execution contexts (the page on 'online'/mount/manual sync, the SW on the
 * Background Sync 'sync' event) with no other coordination between them.
 * IndexedDB serializes readwrite transactions on the same object store across
 * ALL contexts sharing an origin's database — so a get-then-put performed
 * within one transaction is a safe mutex here: only one caller can ever see
 * status === 'pending' and win the claim for a given id, which is exactly
 * what prevents both contexts from submitting the same mutation twice.
 */
export async function sqClaim(id: string, staleAfterMs = 3 * 60_000): Promise<boolean> {
  const db    = await getDB();
  const tx    = db.transaction('sync_queue', 'readwrite');
  const store = tx.objectStore('sync_queue');
  const item  = await req<SyncQueueItem | undefined>(store.get(id));

  if (!item) return false;
  const abandoned = item.status === 'processing' && (Date.now() - (item.claimedAt ?? 0)) > staleAfterMs;
  if (item.status !== 'pending' && !abandoned) return false;

  await req(store.put({ ...item, status: 'processing', claimedAt: Date.now() }));
  return true;
}

export async function sqDelete(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  await req(tx.objectStore('sync_queue').delete(id));
}

export async function sqCount(status?: SyncStatus): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('sync_queue', 'readonly');

  if (status) {
    const index = tx.objectStore('sync_queue').index('status');
    return req(index.count(status));
  }

  return req(tx.objectStore('sync_queue').count());
}

export async function sqClearCompleted(olderThanMs = 24 * 60 * 60 * 1000): Promise<void> {
  const items = await sqGetByStatus('completed');
  const cutoff = Date.now() - olderThanMs;

  for (const item of items) {
    if (!item.completedAt || item.completedAt < cutoff) {
      await sqDelete(item.id).catch(() => {});
    }
  }
}

// ─── data_cache operations ────────────────────────────────────────────────────

export async function dcPut(entry: DataCacheEntry): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('data_cache', 'readwrite');
  await req(tx.objectStore('data_cache').put(entry));
}

export async function dcGet<T>(key: string): Promise<T | null> {
  const db    = await getDB();
  const tx    = db.transaction('data_cache', 'readonly');
  const entry = await req<DataCacheEntry | undefined>(tx.objectStore('data_cache').get(key));

  if (!entry) return null;

  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    // Delete expired entry asynchronously
    getDB().then((db) => {
      const tx2 = db.transaction('data_cache', 'readwrite');
      tx2.objectStore('data_cache').delete(key);
    }).catch(() => {});
    return null;
  }

  return entry.data as T;
}

export async function dcDelete(key: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('data_cache', 'readwrite');
  await req(tx.objectStore('data_cache').delete(key));
}
