import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudents = (classId?: string) => {
  return useQuery({
    queryKey: ["students", classId],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select(`
          *,
          classes:class_id (
            id,
            name
          ),
          departments:department_id (
            id,
            name
          )
        `)
        .order("full_name");

      if (classId) {
        query = query.eq("class_id", classId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useStudent = (studentId: string) => {
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          classes:class_id (
            id,
            name
          )
        `)
        .eq("id", studentId)
        .single();

      if (error) throw error;
      return data;
    },
  });
};
