import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type PeriodType = Database["public"]["Enums"]["period_type"];

export const useGrades = (classSubjectId?: string, period?: string) => {
  return useQuery({
    queryKey: ["grades", classSubjectId, period],
    queryFn: async () => {
      let query = supabase
        .from("student_grades")
        .select(`
          *,
          students:student_id (
            id,
            full_name,
            student_id
          ),
          assessment_types:assessment_type_id (
            id,
            name,
            max_points
          )
        `)
        .order("created_at", { ascending: false });

      if (classSubjectId) {
        query = query.eq("class_subject_id", classSubjectId);
      }

      if (period) {
        query = query.eq("period", period as PeriodType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!classSubjectId && !!period,
  });
};

export const useSaveGrades = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (grades: any[]) => {
      const { data, error } = await supabase
        .from("student_grades")
        .upsert(grades, { onConflict: "id" })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast({
        title: "Success",
        description: "Grades saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useAssessmentTypes = () => {
  return useQuery({
    queryKey: ["assessment-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_types")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data;
    },
  });
};
