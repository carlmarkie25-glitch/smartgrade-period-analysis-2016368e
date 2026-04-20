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
            name,
            display_order
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
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      // Helper: sort by department order first, then class order, then name (with natural numeric tiebreak)
      const sortClasses = (rows: any[]) => {
        const naturalNum = (s: string) => {
          const m = String(s ?? "").match(/\d+/);
          return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
        };
        return [...(rows ?? [])].sort((a, b) => {
          const da = a.departments?.display_order ?? 9999;
          const db = b.departments?.display_order ?? 9999;
          if (da !== db) return da - db;
          const dna = String(a.departments?.name ?? "");
          const dnb = String(b.departments?.name ?? "");
          if (dna !== dnb) return dna.localeCompare(dnb);
          const ca = a.display_order ?? 0;
          const cb = b.display_order ?? 0;
          if (ca !== cb) return ca - cb;
          const na = naturalNum(a.name);
          const nb = naturalNum(b.name);
          if (na !== nb) return na - nb;
          return String(a.name ?? "").localeCompare(String(b.name ?? ""));
        });
      };

      // If admin, show all classes
      if (isAdmin) {
        const { data, error } = await query;
        if (error) throw error;
        return data;
      }

      // If user is not admin
      if (user?.id) {
        if (filterMode === "sponsor") {
          // For reports: show classes where user is a sponsor
          const { data: sponsorData, error: sponsorError } = await supabase
            .from("sponsor_class_assignments")
            .select("class_id")
            .eq("user_id", user.id);

          if (sponsorError) {
            console.error("Error fetching sponsor classes:", sponsorError);
            return [];
          }

          const classIds = sponsorData?.map((s: any) => s.class_id) || [];
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
