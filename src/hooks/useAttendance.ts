import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
      let q = supabase
        .from("attendance_sessions")
        .select("*")
        .eq("class_id", classId!)
        .eq("date", date);
      q = classSubjectId ? q.eq("class_subject_id", classSubjectId) : q.is("class_subject_id", null);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data as AttendanceSession | null;
    },
  });
};

/** Records for a session. */
export const useAttendanceRecords = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ["attendance-records", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return (data ?? []) as AttendanceRecord[];
    },
  });
};

/** Upsert a session and its student records in one go. */
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
      // Upsert session
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

      // Upsert records
      const rows = input.records.map((r) => ({
        session_id: session.id,
        student_id: r.student_id,
        status: r.status,
        note: r.note ?? null,
        school_id: input.schoolId,
      }));

      if (rows.length > 0) {
        const { error: rErr } = await supabase
          .from("attendance_records")
          .upsert(rows, { onConflict: "session_id,student_id" });
        if (rErr) throw rErr;
      }

      return session as AttendanceSession;
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
    },
  });
};
