import { offlineDB, SyncedTable } from "./db";
import { enqueue, getSyncState } from "./sync";

/**
 * Read all rows of a table from the local Dexie cache.
 * Returns the raw row.data objects (matching Supabase shape).
 */
export const readCachedTable = async <T = any>(table: SyncedTable): Promise<T[]> => {
  const rows = await (offlineDB as any)[table].toArray();
  return rows.map((r: any) => r.data as T);
};

/** Read & filter cached rows by an equality predicate. */
export const readCachedWhere = async <T = any>(
  table: SyncedTable,
  predicate: (row: T) => boolean,
): Promise<T[]> => {
  const all = await readCachedTable<T>(table);
  return all.filter(predicate);
};

/**
 * Optimistically write a row to the local cache so UI reflects the change
 * before the server round-trip completes (or while offline).
 */
export const writeCachedRow = async (table: SyncedTable, row: any): Promise<void> => {
  if (!row?.id) return;
  await (offlineDB as any)[table].put({
    id: row.id,
    data: row,
    updated_at: row.updated_at ?? new Date().toISOString(),
    school_id: row.school_id ?? null,
  });
};

export const writeCachedRows = async (table: SyncedTable, rows: any[]): Promise<void> => {
  await Promise.all(rows.map((r) => writeCachedRow(table, r)));
};

/** True when the browser is offline OR the sync engine knows it is. */
export const isOffline = (): boolean => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  return !getSyncState().online;
};

/**
 * Queue a mutation to be replayed when back online.
 * The local Dexie cache is updated immediately so reads stay consistent.
 */
export const queueUpsert = async (
  table: SyncedTable,
  payload: any | any[],
  onConflict?: string,
): Promise<void> => {
  const rows = Array.isArray(payload) ? payload : [payload];
  // Stamp client-side timestamps so cache reflects "newest" on LWW reconciliation
  const stamped = rows.map((r) => ({
    ...r,
    id: r.id ?? crypto.randomUUID(),
    updated_at: new Date().toISOString(),
  }));
  await writeCachedRows(table, stamped);
  await enqueue({ table, op: "upsert", payload: stamped, onConflict });
};

export const queueInsert = async (table: SyncedTable, payload: any): Promise<any> => {
  const stamped = {
    ...payload,
    id: payload.id ?? crypto.randomUUID(),
    created_at: payload.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await writeCachedRow(table, stamped);
  await enqueue({ table, op: "insert", payload: stamped });
  return stamped;
};

export const queueUpdate = async (table: SyncedTable, id: string, patch: any): Promise<void> => {
  const existing = await (offlineDB as any)[table].get(id);
  const merged = { ...(existing?.data ?? {}), ...patch, id, updated_at: new Date().toISOString() };
  await writeCachedRow(table, merged);
  await enqueue({ table, op: "update", payload: merged });
};

export const queueDelete = async (table: SyncedTable, id: string): Promise<void> => {
  await (offlineDB as any)[table].delete(id);
  await enqueue({ table, op: "delete", payload: { id } });
};
