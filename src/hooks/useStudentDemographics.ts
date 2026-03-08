import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const countByField = (students: any[], field: string) => {
  const counts = new Map<string, number>();
  students.forEach(s => {
    const val = s[field] || "Not Specified";
    counts.set(val, (counts.get(val) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const useStudentDemographics = () => {
  return useQuery({
    queryKey: ["student-demographics"],
    queryFn: async () => {
      const { data: students, error } = await supabase
        .from("students")
        .select("gender, ethnicity, religion, county");
      if (error) throw error;
      if (!students) return { gender: [], ethnicity: [], religion: [], county: [], total: 0 };

      return {
        gender: countByField(students, "gender"),
        ethnicity: countByField(students, "ethnicity"),
        religion: countByField(students, "religion"),
        county: countByField(students, "county"),
        total: students.length,
      };
    },
  });
};

export const useTeacherStudentDemographics = (classIds: string[]) => {
  return useQuery({
    queryKey: ["teacher-student-demographics", classIds],
    queryFn: async () => {
      if (classIds.length === 0) return { gender: [], ethnicity: [], religion: [], county: [], total: 0 };
      const { data: students, error } = await supabase
        .from("students")
        .select("gender, ethnicity, religion, county")
        .in("class_id", classIds);
      if (error) throw error;
      if (!students) return { gender: [], ethnicity: [], religion: [], county: [], total: 0 };

      return {
        gender: countByField(students, "gender"),
        ethnicity: countByField(students, "ethnicity"),
        religion: countByField(students, "religion"),
        county: countByField(students, "county"),
        total: students.length,
      };
    },
    enabled: classIds.length > 0,
  });
};
