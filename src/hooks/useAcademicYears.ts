import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** All academic years for the current school, newest first. */
export const useAcademicYears = () => {
  return useQuery({
    queryKey: ["academic-years-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id, year_name, start_date, end_date, is_current")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};

/** Returns the id of the current academic year (is_current=true), if any. */
export const useCurrentAcademicYearId = () => {
  const { data } = useAcademicYears();
  return data?.find((y) => y.is_current)?.id ?? data?.[0]?.id ?? null;
};
