import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type PeriodType = Database["public"]["Enums"]["period_type"];

export type GradeLock = {
  id: string;
  class_subject_id: string;
  period: PeriodType;
  school_id: string | null;
  is_locked: boolean;
  is_released: boolean;
  locked_by: string | null;
  locked_at: string | null;
  released_by: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Lock for a single class_subject + period (for the gradebook). */
export const useGradeLock = (classSubjectId?: string, period?: string) => {
  return useQuery({
    queryKey: ["grade-lock", classSubjectId, period],
    queryFn: async () => {
      if (!classSubjectId || !period) return null;
      const { data, error } = await supabase
        .from("grade_locks" as any)
        .select("*")
        .eq("class_subject_id", classSubjectId)
        .eq("period", period as PeriodType)
        .maybeSingle();
      if (error) throw error;
      return data as GradeLock | null;
    },
    enabled: !!classSubjectId && !!period,
  });
};

/** All locks (for admin release page). */
export const useAllGradeLocks = () => {
  return useQuery({
    queryKey: ["grade-locks-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_locks" as any)
        .select("*");
      if (error) throw error;
      return (data ?? []) as GradeLock[];
    },
  });
};

/** Teacher submits → locks the class_subject + period. */
export const useSubmitGrades = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (params: { classSubjectId: string; period: string }) => {
      const { data: existing } = await supabase
        .from("grade_locks" as any)
        .select("id")
        .eq("class_subject_id", params.classSubjectId)
        .eq("period", params.period as PeriodType)
        .maybeSingle();

      const { data: { user } } = await supabase.auth.getUser();

      if (existing) {
        const { error } = await supabase
          .from("grade_locks" as any)
          .update({
            is_locked: true,
            locked_by: user?.id ?? null,
            locked_at: new Date().toISOString(),
          })
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("grade_locks" as any)
          .insert({
            class_subject_id: params.classSubjectId,
            period: params.period as PeriodType,
            is_locked: true,
            locked_by: user?.id ?? null,
            locked_at: new Date().toISOString(),
          });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["grade-lock", vars.classSubjectId, vars.period] });
      queryClient.invalidateQueries({ queryKey: ["grade-locks-all"] });
      toast({ title: "Submitted", description: "Grades submitted and locked." });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
};

/** Admin: bulk update lock/release flags for many class_subject+period combos. */
export const useUpdateGradeLocks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (params: {
      targets: { classSubjectId: string; period: string }[];
      changes: Partial<Pick<GradeLock, "is_locked" | "is_released">>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      for (const t of params.targets) {
        const { data: existing } = await supabase
          .from("grade_locks" as any)
          .select("id")
          .eq("class_subject_id", t.classSubjectId)
          .eq("period", t.period as PeriodType)
          .maybeSingle();

        const updatePayload: any = { ...params.changes };
        if (params.changes.is_locked === true) {
          updatePayload.locked_by = user?.id ?? null;
          updatePayload.locked_at = now;
        }
        if (params.changes.is_released === true) {
          updatePayload.released_by = user?.id ?? null;
          updatePayload.released_at = now;
        }

        if (existing) {
          const { error } = await supabase
            .from("grade_locks" as any)
            .update(updatePayload)
            .eq("id", (existing as any).id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("grade_locks" as any)
            .insert({
              class_subject_id: t.classSubjectId,
              period: t.period as PeriodType,
              ...updatePayload,
            });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-locks-all"] });
      queryClient.invalidateQueries({ queryKey: ["grade-lock"] });
      toast({ title: "Updated", description: "Grade lock settings saved." });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
};
