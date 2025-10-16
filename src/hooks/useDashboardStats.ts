import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Get total students
      const { count: totalStudents, error: studentsError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (studentsError) throw studentsError;

      // Get total classes
      const { count: totalClasses, error: classesError } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true });

      if (classesError) throw classesError;

      // Get current academic year
      const { data: currentYear, error: yearError } = await supabase
        .from("academic_years")
        .select("*")
        .eq("is_current", true)
        .single();

      if (yearError && yearError.code !== "PGRST116") throw yearError;

      return {
        totalStudents: totalStudents || 0,
        totalClasses: totalClasses || 0,
        currentYear: currentYear?.year_name || "N/A",
      };
    },
  });
};
