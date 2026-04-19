import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";

export interface ReportCardSettings {
  id?: string;
  school_id?: string;
  header_title: string | null;
  header_subtitle: string | null;
  header_address: string | null;
  header_contact: string | null;
  header_website: string | null;
  logo_url: string | null;
  pass_mark: number;
  grade_a_min: number;
  grade_b_min: number;
  grade_c_min: number;
  grade_d_min: number;
  grade_a_label: string;
  grade_b_label: string;
  grade_c_label: string;
  grade_d_label: string;
  grade_f_label: string;
  default_administrator_name: string | null;
  default_class_teacher_name: string | null;
  footer_note: string | null;
}

export const DEFAULT_REPORT_CARD_SETTINGS: ReportCardSettings = {
  header_title: null,
  header_subtitle: null,
  header_address: null,
  header_contact: null,
  header_website: null,
  logo_url: null,
  pass_mark: 60,
  grade_a_min: 90,
  grade_b_min: 80,
  grade_c_min: 70,
  grade_d_min: 60,
  grade_a_label: "Excellent",
  grade_b_label: "Very Good",
  grade_c_label: "Good Standing",
  grade_d_label: "Satisfactory",
  grade_f_label: "Needs Improvement",
  default_administrator_name: null,
  default_class_teacher_name: null,
  footer_note: null,
};

export const useReportCardSettings = () => {
  const { school } = useSchool();
  return useQuery({
    queryKey: ["report-card-settings", school?.id],
    enabled: !!school?.id,
    queryFn: async (): Promise<ReportCardSettings> => {
      const { data, error } = await (supabase as any)
        .from("report_card_settings")
        .select("*")
        .eq("school_id", school!.id)
        .maybeSingle();
      if (error) throw error;
      return { ...DEFAULT_REPORT_CARD_SETTINGS, ...(data ?? {}) };
    },
  });
};

export const useSaveReportCardSettings = () => {
  const qc = useQueryClient();
  const { school } = useSchool();
  return useMutation({
    mutationFn: async (values: Partial<ReportCardSettings>) => {
      if (!school?.id) throw new Error("No school context");
      const payload = { ...values, school_id: school.id };
      const { data, error } = await (supabase as any)
        .from("report_card_settings")
        .upsert(payload, { onConflict: "school_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["report-card-settings"] });
    },
  });
};

export const gradeFromSettings = (
  pct: number | null | undefined,
  s: ReportCardSettings,
): { letter: string; label: string } => {
  if (pct === null || pct === undefined || isNaN(pct)) return { letter: "N/A", label: "" };
  if (pct >= s.grade_a_min) return { letter: "A", label: s.grade_a_label };
  if (pct >= s.grade_b_min) return { letter: "B", label: s.grade_b_label };
  if (pct >= s.grade_c_min) return { letter: "C", label: s.grade_c_label };
  if (pct >= s.grade_d_min) return { letter: "D", label: s.grade_d_label };
  return { letter: "F", label: s.grade_f_label };
};
