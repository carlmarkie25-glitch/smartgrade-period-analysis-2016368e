import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { offlineDB } from "@/lib/offline/db";
import { isOffline, queueUpsert, writeCachedRow } from "@/lib/offline/helpers";

type PeriodType = Database["public"]["Enums"]["period_type"];

/** Build the joined-shape result from local cache (mirrors the online select). */
const buildCachedGrades = async (classSubjectId: string, period: string) => {
  const grades = await offlineDB.student_grades.toArray();
  const students = await offlineDB.students.toArray();
  const assessments = await offlineDB.assessment_types.toArray();
  const studentMap = new Map(students.map((s: any) => [s.data.id, s.data]));
  const assessmentMap = new Map(assessments.map((a: any) => [a.data.id, a.data]));

  return grades
    .filter((g: any) => g.data.class_subject_id === classSubjectId && g.data.period === period)
    .map((g: any) => ({
      ...g.data,
      students: studentMap.get(g.data.student_id)
        ? {
            id: (studentMap.get(g.data.student_id) as any).id,
            full_name: (studentMap.get(g.data.student_id) as any).full_name,
            student_id: (studentMap.get(g.data.student_id) as any).student_id,
          }
        : null,
      assessment_types: assessmentMap.get(g.data.assessment_type_id)
        ? {
            id: (assessmentMap.get(g.data.assessment_type_id) as any).id,
            name: (assessmentMap.get(g.data.assessment_type_id) as any).name,
            max_points: (assessmentMap.get(g.data.assessment_type_id) as any).max_points,
          }
        : null,
    }))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
};

export const useGrades = (classSubjectId?: string, period?: string) => {
  return useQuery({
    queryKey: ["grades", classSubjectId, period],
    queryFn: async () => {
      if (isOffline()) return buildCachedGrades(classSubjectId!, period!);
      try {
        let query = supabase
          .from("student_grades")
          .select(`
            *,
            students:student_id (
              id,
              full_name,
              student_id
            ),
            assessment_types:assessment_type_id (
              id,
              name,
              max_points
            )
          `)
          .order("created_at", { ascending: false });

        if (classSubjectId) query = query.eq("class_subject_id", classSubjectId);
        if (period) query = query.eq("period", period as PeriodType);

        const { data, error } = await query;
        if (error) throw error;
        // Warm cache with raw grade rows (without joins)
        for (const row of data ?? []) {
          const { students: _s, assessment_types: _a, ...raw } = row as any;
          await writeCachedRow("student_grades", raw);
        }
        return data;
      } catch {
        return buildCachedGrades(classSubjectId!, period!);
      }
    },
    enabled: !!classSubjectId && !!period,
  });
};

export const useSaveGrades = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (grades: any[]) => {
      // IMPORTANT: don't send id in bulk upserts (mixed ids/no-ids → null id error)
      const sanitized = grades.map(({ id, ...rest }) => rest);

      if (!isOffline()) {
        try {
          const { data, error } = await supabase
            .from("student_grades")
            .upsert(sanitized, {
              onConflict: "student_id,class_subject_id,period,assessment_type_id",
            })
            .select();
          if (error) throw error;
          for (const row of data ?? []) await writeCachedRow("student_grades", row);
          return data;
        } catch {
          // Fall through to offline queue
        }
      }

      // Offline: stamp ids + cache + enqueue
      await queueUpsert(
        "student_grades",
        sanitized,
        "student_id,class_subject_id,period,assessment_type_id",
      );
      return sanitized;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      queryClient.invalidateQueries({ queryKey: ["student-report"] });
      toast({
        title: isOffline() ? "Saved offline" : "Success",
        description: isOffline()
          ? "Grades will sync when you're back online"
          : "Grades saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useAssessmentTypes = () => {
  return useQuery({
    queryKey: ["assessment-types"],
    queryFn: async () => {
      const fromCache = async () => {
        const rows = await offlineDB.assessment_types.toArray();
        return rows
          .map((r: any) => r.data)
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      };
      if (isOffline()) return fromCache();
      try {
        const { data, error } = await supabase
          .from("assessment_types")
          .select("*")
          .order("display_order");
        if (error) throw error;
        for (const row of data ?? []) await writeCachedRow("assessment_types", row);
        return data;
      } catch {
        return fromCache();
      }
    },
  });
};
