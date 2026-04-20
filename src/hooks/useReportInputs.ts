import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";

export interface ReportInputs {
  behavior?: string | null;
  punctuality?: string | null;
  participation?: string | null;
  homework?: string | null;
  teacher_comment?: string | null;
  excels_in?: string | null;
  can_improve_in?: string | null;
  administrator_name?: string | null;
  class_teacher_name?: string | null;
  promotion_status?: string | null;
  promotion_condition?: string | null;
}

export const useReportInputs = (studentId: string, period: string) => {
  return useQuery({
    queryKey: ["report-inputs", studentId, period],
    queryFn: async () => {
      if (!studentId || !period) return null;
      const { data, error } = await supabase
        .from("student_report_inputs" as any)
        .select("*")
        .eq("student_id", studentId)
        .eq("period", period)
        .maybeSingle();
      if (error) throw error;
      return (data as any) as (ReportInputs & { id: string }) | null;
    },
    enabled: !!studentId && !!period,
  });
};

export const useSaveReportInputs = (studentId: string, period: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: ReportInputs) => {
      const payload: any = {
        student_id: studentId,
        period,
        ...values,
        updated_by: user?.id ?? null,
      };
      const { error } = await supabase
        .from("student_report_inputs" as any)
        .upsert(payload, { onConflict: "student_id,period" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["report-inputs", studentId, period] });
    },
  });
};

export const useCanEditReportInputs = (studentId: string) => {
  const { isAdmin, isTeacher } = useUserRoles();
  return !!(isAdmin || isTeacher) && !!studentId;
};
