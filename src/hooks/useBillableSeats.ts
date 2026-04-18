import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";

export const MIN_SEATS = 50;

/**
 * Returns active student count + billable seat count (with 50-seat floor).
 */
export const useBillableSeats = () => {
  const { school } = useSchool();

  return useQuery({
    queryKey: ["billable-seats", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("school_id", school!.id)
        .eq("is_active" as any, true);

      if (error) throw error;
      const active = count ?? 0;
      return {
        active,
        billable: Math.max(MIN_SEATS, active),
        minimum: MIN_SEATS,
      };
    },
  });
};
