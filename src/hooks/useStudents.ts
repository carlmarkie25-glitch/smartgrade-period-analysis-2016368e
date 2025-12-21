import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/useUserRoles";

// Type for the limited student data returned by the secure function for teachers
interface TeacherStudentData {
  id: string;
  student_id: string;
  full_name: string;
  class_id: string;
  department_id: string;
  photo_url: string | null;
  gender: string | null;
  date_of_birth: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useStudents = (classId?: string) => {
  const { isAdmin, isTeacher, isLoading: rolesLoading } = useUserRoles();

  return useQuery({
    queryKey: ["students", classId, isAdmin, isTeacher],
    queryFn: async () => {
      // Admins get full access to all student data via direct table query
      if (isAdmin) {
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
      }

      // Teachers get limited data via secure function (no sensitive PII)
      if (isTeacher) {
        const { data: students, error } = await supabase
          .rpc('get_teacher_students');

        if (error) throw error;

        // Filter by classId if provided
        let filteredStudents = students as TeacherStudentData[];
        if (classId) {
          filteredStudents = filteredStudents.filter(s => s.class_id === classId);
        }

        // Fetch class and department names for the students
        const classIds = [...new Set(filteredStudents.map(s => s.class_id))];
        const deptIds = [...new Set(filteredStudents.map(s => s.department_id))];

        const [classesRes, deptsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("departments").select("id, name").in("id", deptIds),
        ]);

        const classesMap = new Map(classesRes.data?.map(c => [c.id, c]) || []);
        const deptsMap = new Map(deptsRes.data?.map(d => [d.id, d]) || []);

        // Map to include class and department info, with null for sensitive fields
        return filteredStudents
          .map(s => ({
            ...s,
            // Sensitive fields are null for teachers
            phone_number: null,
            address: null,
            county: null,
            country: null,
            religion: null,
            disability: null,
            health_issues: null,
            father_name: null,
            father_contact: null,
            mother_name: null,
            mother_contact: null,
            emergency_contact_name: null,
            emergency_contact_phone: null,
            emergency_contact_relationship: null,
            previous_school: null,
            previous_class: null,
            nationality: null,
            ethnicity: null,
            classes: classesMap.get(s.class_id) || null,
            departments: deptsMap.get(s.department_id) || null,
          }))
          .sort((a, b) => a.full_name.localeCompare(b.full_name));
      }

      // Other roles (students, parents) - return empty array
      // Students can view their own record via useStudent hook
      return [];
    },
    enabled: !rolesLoading && (isAdmin || isTeacher),
  });
};

export const useStudent = (studentId: string) => {
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();

  return useQuery({
    queryKey: ["student", studentId, isAdmin],
    queryFn: async () => {
      // Only admins and the student themselves should access full student data
      // RLS policies handle the authorization
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
    enabled: !rolesLoading && !!studentId,
  });
};
