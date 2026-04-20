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
  // Kindergarten (letter-grade) standing labels
  kg_a_plus_label: string;
  kg_a_label: string;
  kg_b_plus_label: string;
  kg_b_label: string;
  kg_c_plus_label: string;
  kg_c_label: string;
  kg_d_label: string;
  kg_f_label: string;
  default_administrator_name: string | null;
  default_class_teacher_name: string | null;
  footer_note: string | null;
  seal_url: string | null;
  admin_signature_url: string | null;
  administrator_role_label: string;
  administrator_subtitle: string | null;
  class_teacher_role_label: string;
  class_teacher_subtitle: string | null;
  // Report card colors (school-wide defaults)
  header_bg_color: string;
  accent_color: string;
  secondary_bg_color: string;
  // Text colors
  general_average_text_color: string;
  header_meta_text_color: string;
}

export interface DepartmentReportColors {
  id?: string;
  school_id?: string;
  department_id: string;
  header_bg_color: string | null;
  accent_color: string | null;
  secondary_bg_color: string | null;
  general_average_text_color?: string | null;
  header_meta_text_color?: string | null;
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
  kg_a_plus_label: "Outstanding",
  kg_a_label: "Excellent",
  kg_b_plus_label: "Very Good",
  kg_b_label: "Good",
  kg_c_plus_label: "Above Average",
  kg_c_label: "Average",
  kg_d_label: "Below Average",
  kg_f_label: "Failing",
  default_administrator_name: null,
  default_class_teacher_name: null,
  footer_note: null,
  seal_url: null,
  admin_signature_url: null,
  administrator_role_label: "Administrator",
  administrator_subtitle: null,
  class_teacher_role_label: "Class Teacher",
  class_teacher_subtitle: null,
  header_bg_color: "#1a2a6e",
  accent_color: "#c8a84b",
  secondary_bg_color: "#2a5298",
  general_average_text_color: "#ffffff",
  header_meta_text_color: "#c8a84b",
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
  // D tier removed by design — anything below C is F (e.g., 67 → F).
  return { letter: "F", label: s.grade_f_label };
};

// ============================================================================
// Per-department color overrides
// ============================================================================

export const useDepartmentReportColors = () => {
  const { school } = useSchool();
  return useQuery({
    queryKey: ["dept-report-colors", school?.id],
    enabled: !!school?.id,
    queryFn: async (): Promise<DepartmentReportColors[]> => {
      const { data, error } = await (supabase as any)
        .from("department_report_colors")
        .select("*")
        .eq("school_id", school!.id);
      if (error) throw error;
      return (data ?? []) as DepartmentReportColors[];
    },
  });
};

export const useSaveDepartmentReportColors = () => {
  const qc = useQueryClient();
  const { school } = useSchool();
  return useMutation({
    mutationFn: async (values: DepartmentReportColors) => {
      if (!school?.id) throw new Error("No school context");
      const payload = { ...values, school_id: school.id };
      const { data, error } = await (supabase as any)
        .from("department_report_colors")
        .upsert(payload, { onConflict: "school_id,department_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dept-report-colors"] });
    },
  });
};

export const useDeleteDepartmentReportColors = () => {
  const qc = useQueryClient();
  const { school } = useSchool();
  return useMutation({
    mutationFn: async (departmentId: string) => {
      if (!school?.id) throw new Error("No school context");
      const { error } = await (supabase as any)
        .from("department_report_colors")
        .delete()
        .eq("school_id", school.id)
        .eq("department_id", departmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dept-report-colors"] });
    },
  });
};

/**
 * Resolve effective report card colors for a given department, falling back to
 * school-wide defaults when a department has no override.
 */
export const resolveReportColors = (
  settings: ReportCardSettings,
  deptOverrides: DepartmentReportColors[] | undefined,
  departmentId: string | null | undefined,
): {
  header_bg_color: string;
  accent_color: string;
  secondary_bg_color: string;
  general_average_text_color: string;
  header_meta_text_color: string;
} => {
  const override = departmentId
    ? deptOverrides?.find((d) => d.department_id === departmentId)
    : undefined;
  return {
    header_bg_color: override?.header_bg_color || settings.header_bg_color,
    accent_color: override?.accent_color || settings.accent_color,
    secondary_bg_color: override?.secondary_bg_color || settings.secondary_bg_color,
    general_average_text_color:
      override?.general_average_text_color || settings.general_average_text_color,
    header_meta_text_color:
      override?.header_meta_text_color || settings.header_meta_text_color,
  };
};

/** Standing label for the Kindergarten letter scale, sourced from admin settings. */
export const kgLabelFromSettings = (
  letter: string | null | undefined,
  s: ReportCardSettings,
): string => {
  switch (letter) {
    case "A+": return s.kg_a_plus_label;
    case "A":  return s.kg_a_label;
    case "B+": return s.kg_b_plus_label;
    case "B":  return s.kg_b_label;
    case "C+": return s.kg_c_plus_label;
    case "C":  return s.kg_c_label;
    case "D":  return s.kg_d_label;
    case "F":  return s.kg_f_label;
    default:   return "";
  }
};
