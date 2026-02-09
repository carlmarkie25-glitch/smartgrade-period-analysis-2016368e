import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";

export const useClasses = (filterMode: "teaching" | "sponsor" = "teaching") => {
  const { user } = useAuth();
  const { isAdmin, isTeacher, isLoading: rolesLoading } = useUserRoles();

  return useQuery({
    queryKey: ["classes", user?.id, isAdmin, isTeacher, filterMode],
    queryFn: async () => {
      let query = supabase
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
          ),
          sponsor:teacher_id (
            id,
            user_id,
            full_name
          )
        `)
        .order("name");

      // If admin, show all classes
      if (isAdmin) {
        const { data, error } = await query;
        if (error) throw error;
        return data;
      }

      // If user is not admin
      if (user?.id) {
        if (filterMode === "sponsor") {
          // For reports: show classes where user is a sponsor (via sponsor_class_assignments)
          const { data: sponsorClasses, error: sponsorError } = await supabase
            .from("sponsor_class_assignments")
            .select("class_id")
            .eq("user_id", user.id);

          if (sponsorError) throw sponsorError;

          const classIds = sponsorClasses.map((s) => s.class_id);
          if (classIds.length === 0) return [];

          const { data, error } = await query.in("id", classIds);
          if (error) throw error;
          return data;
        } else {
          // For gradebook/teaching: show classes where user teaches (via class_subjects)
          const { data: teachingClasses, error: teachError } = await supabase
            .from("class_subjects")
            .select("class_id")
            .eq("teacher_id", user.id);

          if (teachError) throw teachError;

          const classIds = [...new Set(teachingClasses.map((tc) => tc.class_id))];
          if (classIds.length === 0) return [];

          const { data, error } = await query.in("id", classIds);
          if (error) throw error;
          return data;
        }
      }

      return [];
    },
    enabled: !rolesLoading && !!user?.id,
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
