import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { offlineDB } from "@/lib/offline/db";
import { isOffline, queueUpsert, writeCachedRow } from "@/lib/offline/helpers";

export type AttendanceStatus = "present" | "absent" | "excused";

export interface AttendanceSession {
  id: string;
  class_id: string;
  class_subject_id: string | null;
  date: string;
  taken_by: string | null;
  notes: string | null;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  note: string | null;
}

/** Look up a session in the local cache by class+date(+subject). */
const findCachedSession = async (
  classId: string,
  date: string,
  classSubjectId: string | null,
): Promise<AttendanceSession | null> => {
  const all = await offlineDB.attendance_sessions.toArray();
  const match = all.find(
    (r: any) =>
      r.data.class_id === classId &&
      r.data.date === date &&
      (r.data.class_subject_id ?? null) === classSubjectId,
  );
  return (match?.data as AttendanceSession) ?? null;
};

/** Fetch (or null) the session for a given class+date (+ optional subject). */
export const useAttendanceSession = (
  classId: string | undefined,
  date: string,
  classSubjectId: string | null = null,
) => {
  return useQuery({
    queryKey: ["attendance-session", classId, date, classSubjectId],
    enabled: !!classId && !!date,
    queryFn: async () => {
      if (isOffline()) {
        return findCachedSession(classId!, date, classSubjectId);
      }
      try {
        let q = supabase
          .from("attendance_sessions")
          .select("*")
          .eq("class_id", classId!)
          .eq("date", date);
        q = classSubjectId ? q.eq("class_subject_id", classSubjectId) : q.is("class_subject_id", null);
        const { data, error } = await q.maybeSingle();
        if (error) throw error;
        if (data) await writeCachedRow("attendance_sessions", data);
        return data as AttendanceSession | null;
      } catch (err) {
        // Network failed — fall back to cache
        return findCachedSession(classId!, date, classSubjectId);
      }
    },
  });
};

/** Records for a session. */
export const useAttendanceRecords = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ["attendance-records", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const fromCache = async (): Promise<AttendanceRecord[]> => {
        const all = await offlineDB.attendance_records.toArray();
        return all
          .filter((r: any) => r.data.session_id === sessionId)
          .map((r: any) => r.data as AttendanceRecord);
      };

      if (isOffline()) return fromCache();
      try {
        const { data, error } = await supabase
          .from("attendance_records")
          .select("*")
          .eq("session_id", sessionId!);
        if (error) throw error;
        const rows = (data ?? []) as AttendanceRecord[];
        for (const r of rows) await writeCachedRow("attendance_records", r);
        return rows;
      } catch {
        return fromCache();
      }
    },
  });
};

/** Upsert a session and its student records in one go.
 * Works fully offline: writes to local cache + outbox, syncs when back online.
 */
export const useSaveAttendance = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      classId: string;
      date: string;
      classSubjectId: string | null;
      schoolId: string | null;
      records: { student_id: string; status: AttendanceStatus; note?: string | null }[];
    }) => {
      // ----- Online path: same as before, but warm the cache -----
      if (!isOffline()) {
        try {
          const sessionPayload: any = {
            class_id: input.classId,
            date: input.date,
            class_subject_id: input.classSubjectId,
            school_id: input.schoolId,
            taken_by: user?.id ?? null,
          };
          const { data: session, error: sErr } = await supabase
            .from("attendance_sessions")
            .upsert(sessionPayload, { onConflict: "class_id,class_subject_id,date" })
            .select()
            .single();
          if (sErr) throw sErr;
          await writeCachedRow("attendance_sessions", session);

          const rows = input.records.map((r) => ({
            session_id: session.id,
            student_id: r.student_id,
            status: r.status,
            note: r.note ?? null,
            school_id: input.schoolId,
          }));
          if (rows.length > 0) {
            const { data: recs, error: rErr } = await supabase
              .from("attendance_records")
              .upsert(rows, { onConflict: "session_id,student_id" })
              .select();
            if (rErr) throw rErr;
            for (const r of recs ?? []) await writeCachedRow("attendance_records", r);
          }
          return session as AttendanceSession;
        } catch {
          // Fall through to offline path on network error
        }
      }

      // ----- Offline path: write cache + enqueue -----
      const existing = await findCachedSession(input.classId, input.date, input.classSubjectId);
      const sessionId = existing?.id ?? crypto.randomUUID();
      const session: AttendanceSession & { school_id: string | null } = {
        id: sessionId,
        class_id: input.classId,
        date: input.date,
        class_subject_id: input.classSubjectId,
        school_id: input.schoolId,
        taken_by: user?.id ?? null,
        notes: existing?.notes ?? null,
      };
      await queueUpsert(
        "attendance_sessions",
        session,
        "class_id,class_subject_id,date",
      );

      const rows = input.records.map((r) => ({
        id: crypto.randomUUID(),
        session_id: sessionId,
        student_id: r.student_id,
        status: r.status,
        note: r.note ?? null,
        school_id: input.schoolId,
      }));
      if (rows.length > 0) {
        await queueUpsert("attendance_records", rows, "session_id,student_id");
      }
      return session;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["attendance-session", vars.classId, vars.date, vars.classSubjectId] });
      qc.invalidateQueries({ queryKey: ["attendance-records"] });
      qc.invalidateQueries({ queryKey: ["attendance-summary"] });
    },
  });
};

/** Per-student attendance summary across a date range. */
export const useStudentAttendanceSummary = (
  studentId: string | undefined,
  fromDate?: string,
  toDate?: string,
) => {
  return useQuery({
    queryKey: ["attendance-summary", studentId, fromDate, toDate],
    enabled: !!studentId,
    queryFn: async () => {
      const fromCache = async () => {
        const sessions = await offlineDB.attendance_sessions.toArray();
        const sessionsById = new Map(sessions.map((s: any) => [s.data.id, s.data]));
        const records = await offlineDB.attendance_records.toArray();
        const counts = { present: 0, absent: 0, excused: 0, total: 0 };
        for (const r of records) {
          const rec = r.data;
          if (rec.student_id !== studentId) continue;
          const sess: any = sessionsById.get(rec.session_id);
          if (!sess) continue;
          if (fromDate && sess.date < fromDate) continue;
          if (toDate && sess.date > toDate) continue;
          counts[rec.status as AttendanceStatus] += 1;
          counts.total += 1;
        }
        const pct = counts.total ? Math.round((counts.present / counts.total) * 100) : 0;
        return { ...counts, percentage: pct };
      };

      if (isOffline()) return fromCache();
      try {
        let q = supabase
          .from("attendance_records")
          .select("status, attendance_sessions!inner(date)")
          .eq("student_id", studentId!);
        if (fromDate) q = q.gte("attendance_sessions.date", fromDate);
        if (toDate) q = q.lte("attendance_sessions.date", toDate);
        const { data, error } = await q;
        if (error) throw error;

        const counts = { present: 0, absent: 0, excused: 0, total: 0 };
        (data ?? []).forEach((r: any) => {
          counts[r.status as AttendanceStatus] += 1;
          counts.total += 1;
        });
        const pct = counts.total ? Math.round((counts.present / counts.total) * 100) : 0;
        return { ...counts, percentage: pct };
      } catch {
        return fromCache();
      }
    },
  });
};
