import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AcademicPeriod {
  id: string;
  period_type: string;
  label: string;
  semester: string;
  start_date: string;
  end_date: string;
  academic_year_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_PERIODS = [
  { period_type: "p1", label: "Period 1", semester: "semester1", display_order: 1 },
  { period_type: "p2", label: "Period 2", semester: "semester1", display_order: 2 },
  { period_type: "p3", label: "Period 3", semester: "semester1", display_order: 3 },
  { period_type: "exam_s1", label: "Semester 1 Exam", semester: "semester1", display_order: 4 },
  { period_type: "p4", label: "Period 4", semester: "semester2", display_order: 5 },
  { period_type: "p5", label: "Period 5", semester: "semester2", display_order: 6 },
  { period_type: "p6", label: "Period 6", semester: "semester2", display_order: 7 },
  { period_type: "exam_s2", label: "Semester 2 Exam", semester: "semester2", display_order: 8 },
];

export const useAcademicPeriods = () => {
  return useQuery({
    queryKey: ["academic-periods"],
    queryFn: async (): Promise<AcademicPeriod[]> => {
      const { data, error } = await supabase
        .from("academic_periods" as any)
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as any[]) || [];
    },
  });
};

export const useUpsertAcademicPeriod = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (period: Omit<AcademicPeriod, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("academic_periods" as any)
        .upsert(period as any, { onConflict: "period_type,academic_year_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-periods"] });
      toast({ title: "Period dates saved" });
    },
    onError: (error: any) => {
      toast({ title: "Error saving period", description: error.message, variant: "destructive" });
    },
  });
};

export const useBulkUpsertPeriods = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (periods: Omit<AcademicPeriod, "id" | "created_at" | "updated_at">[]) => {
      const { error } = await supabase
        .from("academic_periods" as any)
        .upsert(periods as any[], { onConflict: "period_type,academic_year_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-periods"] });
      toast({ title: "All period dates saved successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error saving periods", description: error.message, variant: "destructive" });
    },
  });
};
