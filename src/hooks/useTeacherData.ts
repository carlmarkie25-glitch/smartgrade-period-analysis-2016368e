import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTeacherClasses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["teacher-classes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

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
        .eq("teacher_id", user.id)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useTeacherClassSubjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["teacher-class-subjects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get class subjects where either the teacher is assigned to the class or to the specific subject
      const { data, error } = await supabase
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
            name,
            teacher_id,
            departments:department_id (
              id,
              name
            )
          )
        `)
        .order("created_at");

      if (error) throw error;

      // Filter to only include class subjects where teacher is assigned to the class
      const filtered = data?.filter(cs => cs.classes?.teacher_id === user.id) || [];
      return filtered;
    },
    enabled: !!user?.id,
  });
};

export const useTeacherDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["teacher-dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return {
          totalStudents: 0,
          totalClasses: 0,
          totalSubjects: 0,
          currentYear: "N/A",
        };
      }

      // Get teacher's classes
      const { data: classes, error: classesError } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user.id);

      if (classesError) throw classesError;

      const classIds = classes?.map(c => c.id) || [];

      // Get students in teacher's classes
      let totalStudents = 0;
      if (classIds.length > 0) {
        const { count, error: studentsError } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .in("class_id", classIds);

        if (studentsError) throw studentsError;
        totalStudents = count || 0;
      }

      // Get class subjects for teacher's classes
      let totalSubjects = 0;
      if (classIds.length > 0) {
        const { count, error: subjectsError } = await supabase
          .from("class_subjects")
          .select("*", { count: "exact", head: true })
          .in("class_id", classIds);

        if (subjectsError) throw subjectsError;
        totalSubjects = count || 0;
      }

      // Get current academic year
      const { data: currentYear, error: yearError } = await supabase
        .from("academic_years")
        .select("year_name")
        .eq("is_current", true)
        .single();

      if (yearError && yearError.code !== "PGRST116") throw yearError;

      return {
        totalStudents,
        totalClasses: classIds.length,
        totalSubjects,
        currentYear: currentYear?.year_name || "N/A",
      };
    },
    enabled: !!user?.id,
  });
};

export const useTeacherRecentGrades = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["teacher-recent-grades", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get teacher's classes
      const { data: classes, error: classesError } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user.id);

      if (classesError) throw classesError;

      const classIds = classes?.map(c => c.id) || [];
      if (classIds.length === 0) return [];

      // Get class subjects for these classes
      const { data: classSubjects, error: csError } = await supabase
        .from("class_subjects")
        .select("id")
        .in("class_id", classIds);

      if (csError) throw csError;

      const csIds = classSubjects?.map(cs => cs.id) || [];
      if (csIds.length === 0) return [];

      // Get recent grades
      const { data: grades, error: gradesError } = await supabase
        .from("student_grades")
        .select(`
          *,
          students:student_id (
            full_name
          ),
          class_subjects:class_subject_id (
            subjects:subject_id (
              name
            ),
            classes:class_id (
              name
            )
          )
        `)
        .in("class_subject_id", csIds)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (gradesError) throw gradesError;
      return grades || [];
    },
    enabled: !!user?.id,
  });
};
