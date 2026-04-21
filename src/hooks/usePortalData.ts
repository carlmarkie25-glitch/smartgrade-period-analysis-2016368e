import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Self-lookup: students row for the logged-in student user. */
export const useMyStudent = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-student", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!profile) return null;

      const { data, error } = await supabase
        .from("students")
        .select(`
          id, student_id, full_name, photo_url, gender, date_of_birth,
          class_id, department_id,
          classes:class_id ( id, name, academic_years:academic_year_id ( id, year_name, is_current ) ),
          departments:department_id ( id, name )
        `)
        .eq("user_id", profile.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

/** Children linked to the logged-in parent via parent_student_assignments. */
export const useMyChildren = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-children", user?.id],
    enabled: !!user?.id,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("parent_student_assignments")
        .select(`
          student_id,
          students:student_id (
            id, student_id, full_name, photo_url, gender, date_of_birth,
            class_id, department_id,
            classes:class_id ( id, name, academic_years:academic_year_id ( id, year_name, is_current ) ),
            departments:department_id ( id, name )
          )
        `)
        .eq("parent_user_id", user.id);
      if (error) {
        console.error("useMyChildren error:", error);
        throw error;
      }
      return (data ?? [])
        .map((row: any) => row.students)
        .filter(Boolean);
    },
  });
};

/**
 * All academic years the given student was/is enrolled in (newest first),
 * with the class they were in for each year.
 */
export const useStudentEnrollmentYears = (studentId?: string) => {
  return useQuery({
    queryKey: ["student-enrollment-years", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select(`
          id, status, final_average, enrolled_at,
          academic_year_id,
          academic_years:academic_year_id ( id, year_name, start_date, is_current ),
          class_id,
          classes:class_id ( id, name )
        `)
        .eq("student_id", studentId!);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      // Sort by year start_date desc.
      rows.sort((a, b) => {
        const aDate = a.academic_years?.start_date ?? "";
        const bDate = b.academic_years?.start_date ?? "";
        return bDate.localeCompare(aDate);
      });
      return rows;
    },
  });
};

/**
 * Period totals (with rank) for one student, optionally scoped to an academic year.
 * When yearId is provided we restrict to class_subjects whose class belongs to that year.
 */
export const useStudentPeriodTotals = (studentId?: string, yearId?: string | null) => {
  return useQuery({
    queryKey: ["student-period-totals", studentId, yearId ?? "all"],
    enabled: !!studentId,
    queryFn: async () => {
      let query = supabase
        .from("student_period_totals")
        .select(`
          period, total_score, class_rank,
          class_subject_id,
          class_subjects:class_subject_id (
            class_id,
            classes:class_id ( id, academic_year_id ),
            subjects:subject_id ( name, code )
          )
        `)
        .eq("student_id", studentId!)
        .order("period");
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as any[];
      if (!yearId) return rows;
      return rows.filter((r) => r.class_subjects?.classes?.academic_year_id === yearId);
    },
  });
};

/**
 * Bills + items + payments for one student, optionally scoped to an academic year.
 */
export const useStudentBilling = (studentId?: string, yearId?: string | null) => {
  return useQuery({
    queryKey: ["student-billing", studentId, yearId ?? "all"],
    enabled: !!studentId,
    queryFn: async () => {
      let q = supabase
        .from("student_bills")
        .select("*, academic_years:academic_year_id ( year_name, is_current )")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false });
      if (yearId) q = q.eq("academic_year_id", yearId);

      const { data: bills, error: bErr } = await q;
      if (bErr) throw bErr;

      const billIds = (bills ?? []).map((b) => b.id);
      const [{ data: items }, { data: payments }] = await Promise.all([
        billIds.length
          ? supabase.from("student_bill_items").select("*").in("bill_id", billIds)
          : Promise.resolve({ data: [] as any[] }),
        billIds.length
          ? supabase
              .from("student_payments")
              .select("*")
              .in("bill_id", billIds)
              .order("payment_date", { ascending: false })
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const itemsByBill: Record<string, any[]> = {};
      (items ?? []).forEach((it: any) => {
        (itemsByBill[it.bill_id] ||= []).push(it);
      });
      const paymentsByBill: Record<string, any[]> = {};
      (payments ?? []).forEach((p: any) => {
        (paymentsByBill[p.bill_id] ||= []).push(p);
      });

      return (bills ?? []).map((b) => ({
        ...b,
        items: itemsByBill[b.id] ?? [],
        payments: paymentsByBill[b.id] ?? [],
      }));
    },
  });
};
