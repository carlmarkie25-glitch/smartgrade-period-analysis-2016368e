import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useClasses = () => {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          *,
          departments:department_id (
            id,
            name
          ),
          academic_years:academic_year_id (
            id,
            year_name
          )
        `)
        .order("name");

      if (error) throw error;
      return data;
    },
  });
};

export const useClassSubjects = (classId?: string) => {
  return useQuery({
    queryKey: ["class-subjects", classId],
    queryFn: async () => {
      let query = supabase
        .from("class_subjects")
        .select(`
          *,
          subjects:subject_id (
            id,
            name,
            code
          ),
          classes:class_id (
            id,
            name
          )
        `)
        .order("period_number");

      if (classId) {
        query = query.eq("class_id", classId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
