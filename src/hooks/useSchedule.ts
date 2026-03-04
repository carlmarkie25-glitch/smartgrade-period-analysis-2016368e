import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ScheduleItem {
  id: string;
  user_id: string;
  date: string; // ISO date string
  start_time: string;
  end_time: string;
  subject?: string;
  location?: string;
  [key: string]: any;
}

// Fetches schedule entries for the current user (today by default).
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
        .from<ScheduleItem>("schedules")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("start_time");

      if (err1) throw err1;
      let results: ScheduleItem[] = personal || [];

      // determine class_id or profile id for class schedule lookup
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

      // fetch class schedules applicable to this user (by class or teacher)
      const scheduleQuery = supabase
        .from("class_schedules")
        .select("*, classes(name), teachers:profiles!class_schedules_teacher_id_fkey(id,full_name), subjects(name)")
        .eq("day_of_week", dayOfWeek);

      if (classId) {
        scheduleQuery.eq("class_id", classId);
      }
      if (profileId) {
        scheduleQuery.or(`teacher_id.eq.${profileId}`);
      }

      const { data: classSchedules, error: err2 } = await scheduleQuery;
      if (err2) throw err2;

      if (classSchedules && classSchedules.length > 0) {
        // map class schedule entries into ScheduleItem-like objects so page can render uniformly
        const mapped = classSchedules.map((cs: any) => ({
          id: cs.id,
          user_id: cs.teacher_id || "",
          date: today,
          start_time: cs.start_time,
          end_time: cs.end_time,
          subject: cs.subjects?.name || null,
          location: cs.classes?.name || null, // maybe display class name
          teacher_name: cs.teachers?.full_name || null,
          isClassSchedule: true,
        }));
        results = results.concat(mapped);
      }

      // sort by start_time
      results.sort((a, b) => a.start_time.localeCompare(b.start_time));

      return results;
    },
    enabled: !!user,
  });
};
