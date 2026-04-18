import Dexie, { Table } from "dexie";

// Mirror of core Supabase tables for offline read.
// Each row carries `updated_at` so the sync engine can do last-write-wins.
export interface CachedRow {
  id: string;
  data: Record<string, any>;
  updated_at: string; // ISO
  school_id?: string | null;
}

// Mutations queued while offline. Replayed in FIFO order.
export type OutboxOp = "insert" | "update" | "upsert" | "delete";

export interface OutboxEntry {
  id?: number; // auto-increment
  table: string;
  op: OutboxOp;
  payload: any; // for insert/update/upsert: row data; for delete: { id }
  onConflict?: string; // for upsert
  client_ts: number; // ms epoch when enqueued
  attempts: number;
  last_error?: string | null;
}

export interface SyncMeta {
  key: string; // e.g. "lastPull:students"
  value: string;
}

class LuminiOfflineDB extends Dexie {
  // Cached read tables
  students!: Table<CachedRow, string>;
  classes!: Table<CachedRow, string>;
  class_subjects!: Table<CachedRow, string>;
  subjects!: Table<CachedRow, string>;
  departments!: Table<CachedRow, string>;
  academic_years!: Table<CachedRow, string>;
  academic_periods!: Table<CachedRow, string>;
  assessment_types!: Table<CachedRow, string>;
  attendance_sessions!: Table<CachedRow, string>;
  attendance_records!: Table<CachedRow, string>;
  student_grades!: Table<CachedRow, string>;
  student_period_totals!: Table<CachedRow, string>;
  notifications!: Table<CachedRow, string>;
  profiles!: Table<CachedRow, string>;

  outbox!: Table<OutboxEntry, number>;
  meta!: Table<SyncMeta, string>;

  constructor() {
    super("lumini-offline");

    // Single schema definition. Indexes are minimal — most reads are by id.
    this.version(1).stores({
      students: "id, updated_at, school_id",
      classes: "id, updated_at, school_id",
      class_subjects: "id, updated_at, school_id",
      subjects: "id, updated_at, school_id",
      departments: "id, updated_at, school_id",
      academic_years: "id, school_id",
      academic_periods: "id, updated_at, school_id",
      assessment_types: "id, school_id",
      attendance_sessions: "id, updated_at, school_id",
      attendance_records: "id, updated_at, school_id",
      student_grades: "id, updated_at, school_id",
      student_period_totals: "id, updated_at, school_id",
      notifications: "id, school_id",
      profiles: "id, updated_at, school_id",
      outbox: "++id, table, client_ts",
      meta: "key",
    });
  }
}

export const offlineDB = new LuminiOfflineDB();

export const SYNCED_TABLES = [
  "students",
  "classes",
  "class_subjects",
  "subjects",
  "departments",
  "academic_years",
  "academic_periods",
  "assessment_types",
  "attendance_sessions",
  "attendance_records",
  "student_grades",
  "student_period_totals",
  "notifications",
  "profiles",
] as const;

export type SyncedTable = typeof SYNCED_TABLES[number];

export const getMeta = async (key: string): Promise<string | null> => {
  const row = await offlineDB.meta.get(key);
  return row?.value ?? null;
};

export const setMeta = async (key: string, value: string): Promise<void> => {
  await offlineDB.meta.put({ key, value });
};
