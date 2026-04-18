import { supabase } from "@/integrations/supabase/client";
import { offlineDB, SYNCED_TABLES, SyncedTable, getMeta, setMeta, OutboxEntry } from "./db";

type Listener = (state: SyncState) => void;

export interface SyncState {
  online: boolean;
  syncing: boolean;
  pendingOps: number;
  lastSyncAt: string | null;
  lastError: string | null;
}

let state: SyncState = {
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
  syncing: false,
  pendingOps: 0,
  lastSyncAt: null,
  lastError: null,
};

const listeners = new Set<Listener>();

const emit = () => {
  for (const l of listeners) l(state);
};

const update = (patch: Partial<SyncState>) => {
  state = { ...state, ...patch };
  emit();
};

export const getSyncState = () => state;

export const subscribeSync = (listener: Listener): (() => void) => {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
};

const refreshPending = async () => {
  const count = await offlineDB.outbox.count();
  update({ pendingOps: count });
};

// ----- Pull: fetch rows updated since last pull, last-write-wins merge -----
const pullTable = async (table: SyncedTable): Promise<void> => {
  const cursorKey = `lastPull:${table}`;
  const since = (await getMeta(cursorKey)) ?? "1970-01-01T00:00:00Z";

  let query = (supabase as any).from(table).select("*");
  // Tables without updated_at: just full pull (small lookup tables)
  const hasUpdatedAt = !["academic_years", "assessment_types", "notifications"].includes(table);
  if (hasUpdatedAt) query = query.gt("updated_at", since);

  const { data, error } = await query.limit(1000);
  if (error) throw error;
  if (!data || data.length === 0) {
    if (!hasUpdatedAt) await setMeta(cursorKey, new Date().toISOString());
    return;
  }

  let maxUpdated = since;
  await offlineDB.transaction("rw", (offlineDB as any)[table], async () => {
    for (const row of data as any[]) {
      const rowUpdated = row.updated_at ?? row.created_at ?? new Date().toISOString();
      // Last-write-wins: skip if cached copy is newer
      const existing = await (offlineDB as any)[table].get(row.id);
      if (existing && existing.updated_at && existing.updated_at > rowUpdated) continue;
      await (offlineDB as any)[table].put({
        id: row.id,
        data: row,
        updated_at: rowUpdated,
        school_id: row.school_id ?? null,
      });
      if (rowUpdated > maxUpdated) maxUpdated = rowUpdated;
    }
  });

  await setMeta(cursorKey, maxUpdated);
};

// ----- Push: drain outbox in FIFO order -----
const pushOutbox = async (): Promise<void> => {
  const entries = await offlineDB.outbox.orderBy("client_ts").toArray();
  for (const entry of entries) {
    try {
      await applyOutboxEntry(entry);
      await offlineDB.outbox.delete(entry.id!);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      await offlineDB.outbox.update(entry.id!, {
        attempts: (entry.attempts ?? 0) + 1,
        last_error: msg,
      });
      // Stop on first failure to preserve order
      throw err;
    }
  }
};

const applyOutboxEntry = async (entry: OutboxEntry): Promise<void> => {
  const t = (supabase as any).from(entry.table);
  if (entry.op === "delete") {
    const { error } = await t.delete().eq("id", entry.payload.id);
    if (error) throw error;
  } else if (entry.op === "upsert") {
    const { error } = await t.upsert(entry.payload, entry.onConflict ? { onConflict: entry.onConflict } : undefined);
    if (error) throw error;
  } else if (entry.op === "update") {
    const { id, ...patch } = entry.payload;
    const { error } = await t.update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await t.insert(entry.payload);
    if (error) throw error;
  }
};

let syncInFlight: Promise<void> | null = null;

export const syncNow = async (): Promise<void> => {
  if (!state.online) return;
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    update({ syncing: true, lastError: null });
    try {
      // Push first so local edits don't get clobbered by a fresh pull.
      await pushOutbox();
      for (const table of SYNCED_TABLES) {
        await pullTable(table);
      }
      update({ lastSyncAt: new Date().toISOString() });
    } catch (err: any) {
      update({ lastError: err?.message ?? "Sync failed" });
    } finally {
      await refreshPending();
      update({ syncing: false });
      syncInFlight = null;
    }
  })();

  return syncInFlight;
};

// ----- Enqueue helpers used by hooks -----
export const enqueue = async (entry: Omit<OutboxEntry, "id" | "client_ts" | "attempts">): Promise<void> => {
  await offlineDB.outbox.add({
    ...entry,
    client_ts: Date.now(),
    attempts: 0,
    last_error: null,
  });
  await refreshPending();
  if (state.online) syncNow().catch(() => {});
};

// ----- Auto-sync wiring -----
let installed = false;

export const installSyncEngine = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("online", () => {
    update({ online: true });
    syncNow().catch(() => {});
  });
  window.addEventListener("offline", () => update({ online: false }));

  // Initial pending count
  refreshPending().catch(() => {});

  // Periodic background sync every 60s when online
  setInterval(() => {
    if (state.online) syncNow().catch(() => {});
  }, 60_000);

  // First sync after a short delay so auth has time to settle
  setTimeout(() => {
    if (state.online) syncNow().catch(() => {});
  }, 2_000);
};
