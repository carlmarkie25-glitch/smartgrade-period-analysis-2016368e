import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ParentChildAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parent: {
    id: string;
    user_id: string;
    full_name: string;
  } | null;
}

export const ParentChildAssignmentDialog = ({
  open,
  onOpenChange,
  parent,
}: ParentChildAssignmentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Fetch all students
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["all-students-for-parent-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id,
          student_id,
          full_name,
          photo_url,
          class:classes(name),
          department:departments(name)
        `)
        .order("full_name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch current assignments for this parent
  const { data: currentAssignments } = useQuery({
    queryKey: ["parent-assignments", parent?.user_id],
    queryFn: async () => {
      if (!parent) return [];
      const { data, error } = await supabase
        .from("parent_student_assignments")
        .select("student_id")
        .eq("parent_user_id", parent.user_id);

      if (error) throw error;
      return data;
    },
    enabled: open && !!parent,
  });

  // Fetch all parent assignments to show which students are linked to other parents
  const { data: allAssignments } = useQuery({
    queryKey: ["all-parent-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_student_assignments")
        .select("parent_user_id, student_id");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch parent profiles for names
  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-parent-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (currentAssignments) {
      setSelectedStudents(currentAssignments.map((a) => a.student_id));
    }
  }, [currentAssignments]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!parent) return;
      const currentIds = currentAssignments?.map((a) => a.student_id) || [];
      const toAdd = selectedStudents.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !selectedStudents.includes(id));

      for (const studentId of toRemove) {
        const { error } = await supabase
          .from("parent_student_assignments")
          .delete()
          .eq("parent_user_id", parent.user_id)
          .eq("student_id", studentId);
        if (error) throw error;
      }

      for (const studentId of toAdd) {
        const { error } = await supabase
          .from("parent_student_assignments")
          .insert({ parent_user_id: parent.user_id, student_id: studentId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["all-parent-assignments"] });
      toast({ title: "Child assignments updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Error saving assignments", description: error.message, variant: "destructive" });
    },
  });

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getOtherParentName = (studentId: string) => {
    const assignment = allAssignments?.find(
      (a) => a.student_id === studentId && a.parent_user_id !== parent?.user_id
    );
    if (!assignment) return null;
    const profile = profiles?.find((p) => p.user_id === assignment.parent_user_id);
    return profile?.full_name || "Another parent";
  };

  const filteredStudents = students?.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Assign Children to {parent?.full_name}</DialogTitle>
          <DialogDescription>
            Select students that are children of this parent.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[350px] pr-4">
          {studentsLoading ? (
            <p className="text-muted-foreground">Loading students...</p>
          ) : filteredStudents && filteredStudents.length > 0 ? (
            <div className="space-y-2">
              {filteredStudents.map((student) => {
                const isSelected = selectedStudents.includes(student.id);
                const otherParent = getOtherParentName(student.id);

                return (
                  <div
                    key={student.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.photo_url || ""} />
                      <AvatarFallback className="text-xs">
                        {student.full_name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.full_name}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">ID: {student.student_id}</span>
                        <Badge variant="outline" className="text-xs">
                          {student.class?.name || "No Class"}
                        </Badge>
                      </div>
                    </div>
                    {otherParent && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1 shrink-0">
                        <UserCheck className="h-3 w-3" />
                        {otherParent}
                      </Badge>
                    )}
                    {isSelected && (
                      <Badge className="text-xs shrink-0">Linked</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No students found.</p>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            {selectedStudents.length} child{selectedStudents.length !== 1 ? "ren" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Assignments"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
