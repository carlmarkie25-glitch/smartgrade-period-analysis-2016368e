import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AcademicEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  color: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const EVENT_TYPES = [
  { value: "lesson", label: "Lesson", color: "#3b82f6" },
  { value: "quiz", label: "Quiz", color: "#f59e0b" },
  { value: "test", label: "Test", color: "#ef4444" },
  { value: "notes", label: "Notes", color: "#8b5cf6" },
  { value: "exam", label: "Exam", color: "#dc2626" },
  { value: "holiday", label: "Holiday", color: "#10b981" },
  { value: "sports", label: "Sports", color: "#06b6d4" },
  { value: "meeting", label: "Meeting", color: "#6366f1" },
  { value: "other", label: "Other", color: "#64748b" },
];

export const useAcademicEvents = () => {
  return useQuery({
    queryKey: ["academic-events"],
    queryFn: async (): Promise<AcademicEvent[]> => {
      const { data, error } = await supabase
        .from("academic_events" as any)
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data as any[]) || [];
    },
  });
};

export const useCreateAcademicEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (event: Omit<AcademicEvent, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("academic_events" as any)
        .insert(event as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-events"] });
      toast({ title: "Event created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating event", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateAcademicEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AcademicEvent> & { id: string }) => {
      const { error } = await supabase
        .from("academic_events" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-events"] });
      toast({ title: "Event updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating event", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteAcademicEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("academic_events" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-events"] });
      toast({ title: "Event deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting event", description: error.message, variant: "destructive" });
    },
  });
};
