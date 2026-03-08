import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ScheduleItem {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  subject?: string;
  location?: string;
  teacher_name?: string;
  isClassSchedule?: boolean;
  [key: string]: any;
}

export const useSchedule = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["schedule", user?.id],
    queryFn: async (): Promise<ScheduleItem[]> => {
      if (!user) return [];

      const todayDate = new Date();
      const today = todayDate.toISOString().split("T")[0];
      const dayOfWeek = todayDate.getDay();

      // personal entries for user
      const { data: personal, error: err1 } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("start_time");

      if (err1) throw err1;
      let results: ScheduleItem[] = (personal as any[]) || [];

      let classId: string | null = null;
      let profileId: string | null = null;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      profileId = profileData?.id || null;

      const { data: studentData } = await supabase
        .from("students")
        .select("class_id")
        .eq("user_id", user.id)
        .single();
      classId = studentData?.class_id || null;

      // Build class schedule query
      let query = supabase
        .from("class_schedules")
        .select("*, classes(name), teachers:profiles!class_schedules_teacher_id_fkey(id,full_name), subjects(name)")
        .eq("day_of_week", dayOfWeek);

      if (classId && profileId) {
        query = query.or(`class_id.eq.${classId},teacher_id.eq.${profileId}`);
      } else if (classId) {
        query = query.eq("class_id", classId);
      } else if (profileId) {
        query = query.eq("teacher_id", profileId);
      } else {
        // No class or profile, skip class schedules
        results.sort((a, b) => a.start_time.localeCompare(b.start_time));
        return results;
      }

      const { data: classSchedules, error: err2 } = await query;
      if (err2) throw err2;

      if (classSchedules && classSchedules.length > 0) {
        const mapped = classSchedules.map((cs: any) => ({
          id: cs.id,
          user_id: cs.teacher_id || "",
          date: today,
          start_time: cs.start_time,
          end_time: cs.end_time,
          subject: cs.subjects?.name || null,
          location: cs.classes?.name || null,
          teacher_name: cs.teachers?.full_name || null,
          isClassSchedule: true,
        }));
        results = results.concat(mapped);
      }

      results.sort((a, b) => a.start_time.localeCompare(b.start_time));
      return results;
    },
    enabled: !!user,
  });
};
