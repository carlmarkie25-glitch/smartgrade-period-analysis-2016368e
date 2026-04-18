import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type DepartureStatus = "graduated" | "transferred" | "withdrawn" | "expelled";

/** Mark a student as departed (admin only). */
export const useMarkDeparted = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (args: {
      studentId: string;
      status: DepartureStatus;
      departureDate?: string;
      reason?: string;
    }) => {
      const { error } = await supabase.rpc("mark_student_departed", {
        p_student_id: args.studentId,
        p_status: args.status,
        p_departure_date: args.departureDate ?? new Date().toISOString().slice(0, 10),
        p_reason: args.reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["departed-students"] });
      qc.invalidateQueries({ queryKey: ["billable-seats"] });
      toast({ title: "Student status updated" });
    },
    onError: (err: any) =>
      toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });
};

/** Reinstate a student to active. */
export const useReinstateStudent = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from("students")
        .update({
          status: "active",
          departure_date: null,
          departure_reason: null,
        })
        .eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["departed-students"] });
      qc.invalidateQueries({ queryKey: ["billable-seats"] });
      toast({ title: "Student reinstated" });
    },
    onError: (err: any) =>
      toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });
};

/** Departed (non-archived) students with retention countdown. */
export const useDepartedStudents = () => {
  return useQuery({
    queryKey: ["departed-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(
          "id, full_name, student_id, status, departure_date, departure_reason, retention_expires_at, archived_at, classes:class_id(name), departments:department_id(name)",
        )
        .in("status", ["graduated", "transferred", "withdrawn", "expelled"])
        .is("archived_at", null)
        .order("retention_expires_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
};

/** Archived students (anonymized summaries only). */
export const useArchivedStudents = () => {
  return useQuery({
    queryKey: ["archived-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, archived_at, archive_summary")
        .eq("status", "archived")
        .order("archived_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
};
