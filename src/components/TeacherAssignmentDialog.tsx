import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TeacherAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: {
    id: string;
    user_id: string;
    full_name: string;
  } | null;
}

export const TeacherAssignmentDialog = ({
  open,
  onOpenChange,
  teacher,
}: TeacherAssignmentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Fetch all classes with their current teacher assignments
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["all-classes-for-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          teacher_id,
          department:departments(name),
          academic_year:academic_years(year_name)
        `)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch class subjects for the selected classes
  const { data: classSubjects } = useQuery({
    queryKey: ["class-subjects-for-teacher", teacher?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_subjects")
        .select(`
          id,
          class_id,
          teacher_id,
          subject:subjects(id, name, code)
        `);

      if (error) throw error;
      return data;
    },
    enabled: open && !!teacher,
  });

  // Initialize selected classes when dialog opens
  useEffect(() => {
    if (classes && teacher) {
      const teacherClasses = classes
        .filter((c) => c.teacher_id === teacher.id)
        .map((c) => c.id);
      setSelectedClasses(teacherClasses);
    }
  }, [classes, teacher]);

  // Mutation to update class teacher assignments
  const updateClassAssignment = useMutation({
    mutationFn: async ({ classId, teacherId }: { classId: string; teacherId: string | null }) => {
      const { error } = await supabase
        .from("classes")
        .update({ teacher_id: teacherId })
        .eq("id", classId);

      if (error) throw error;
    },
    onError: (error: any) => {
      toast({
        title: "Error updating assignment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    if (!teacher || !classes) return;

    try {
      // Get currently assigned classes for this teacher
      const currentlyAssigned = classes
        .filter((c) => c.teacher_id === teacher.id)
        .map((c) => c.id);

      // Classes to add (newly selected)
      const toAdd = selectedClasses.filter((id) => !currentlyAssigned.includes(id));
      
      // Classes to remove (were assigned, now unselected)
      const toRemove = currentlyAssigned.filter((id) => !selectedClasses.includes(id));

      // Process additions
      for (const classId of toAdd) {
        await updateClassAssignment.mutateAsync({ classId, teacherId: teacher.id });
      }

      // Process removals
      for (const classId of toRemove) {
        await updateClassAssignment.mutateAsync({ classId, teacherId: null });
      }

      queryClient.invalidateQueries({ queryKey: ["all-classes-for-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      
      toast({ title: "Class assignments updated successfully" });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving assignments",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const getClassSubjectsForClass = (classId: string) => {
    return classSubjects?.filter((cs) => cs.class_id === classId) || [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Assign Classes to {teacher?.full_name}</DialogTitle>
          <DialogDescription>
            Select the classes this teacher will be responsible for. The teacher will be able to manage students and grades for these classes.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {classesLoading ? (
            <p className="text-muted-foreground">Loading classes...</p>
          ) : classes && classes.length > 0 ? (
            <div className="space-y-3">
              {classes.map((cls) => {
                const isSelected = selectedClasses.includes(cls.id);
                const isAssignedToOther = cls.teacher_id && cls.teacher_id !== teacher?.id;
                const subjects = getClassSubjectsForClass(cls.id);

                return (
                  <div
                    key={cls.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isSelected ? "border-primary bg-primary/5" : "border-border"
                    } ${isAssignedToOther ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={cls.id}
                        checked={isSelected}
                        onCheckedChange={() => toggleClass(cls.id)}
                        disabled={isAssignedToOther}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={cls.id}
                          className="text-base font-medium cursor-pointer"
                        >
                          {cls.name}
                        </Label>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {cls.department?.name || "No Department"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {cls.academic_year?.year_name || "No Year"}
                          </Badge>
                          {isAssignedToOther && (
                            <Badge variant="destructive" className="text-xs">
                              Assigned to another teacher
                            </Badge>
                          )}
                        </div>
                        {subjects.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Subjects:</p>
                            <div className="flex gap-1 flex-wrap">
                              {subjects.map((cs) => (
                                <Badge key={cs.id} variant="outline" className="text-xs">
                                  {cs.subject?.name} ({cs.subject?.code})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No classes available. Create classes in the Classes tab first.
            </p>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateClassAssignment.isPending}>
            {updateClassAssignment.isPending ? "Saving..." : "Save Assignments"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
