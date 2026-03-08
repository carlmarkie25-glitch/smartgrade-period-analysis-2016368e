import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClassScheduleEntry {
  id: string;
  class_id: string;
  teacher_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id: string | null;
  classes?: { id: string; name: string };
  teachers?: { id: string; full_name: string };
  subjects?: { id: string; name: string };
}

export const useClassSchedules = () => {
  return useQuery({
    queryKey: ["class-schedules"],
    queryFn: async (): Promise<ClassScheduleEntry[]> => {
      const { data, error } = await supabase
        .from("class_schedules")
        .select(
          `*,
            classes(id,name),
            teachers:profiles!class_schedules_teacher_id_fkey(id,full_name),
            subjects(id,name)`
        )
        .order("day_of_week")
        .order("start_time");
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: true,
  });
};
