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

      // If user is a teacher but not an admin, filter by their role
      if (isTeacher && !isAdmin && user?.id) {
        if (filterMode === "sponsor") {
          // For reports: only show classes where teacher is the sponsor
          query = query.eq("teacher_id", user.id);
        } else {
          // For gradebook: show classes where teacher teaches (via class_subjects)
          query = query.eq("teacher_id", user.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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
