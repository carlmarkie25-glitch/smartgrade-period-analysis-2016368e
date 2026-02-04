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
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, string[]>>({});
  const [expandedClasses, setExpandedClasses] = useState<string[]>([]);

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

  // Fetch all class subjects
  const { data: classSubjects } = useQuery({
    queryKey: ["class-subjects-for-teacher-assignment"],
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
    enabled: open,
  });

  // Initialize selected classes and subjects when dialog opens
  useEffect(() => {
    if (classes && classSubjects && teacher) {
      // Get classes where this teacher is the main teacher
      const teacherClasses = classes
        .filter((c) => c.teacher_id === teacher.id)
        .map((c) => c.id);
      setSelectedClasses(teacherClasses);

      // Get subjects assigned to this teacher
      const teacherSubjects: Record<string, string[]> = {};
      classSubjects.forEach((cs) => {
        if (cs.teacher_id === teacher.id) {
          if (!teacherSubjects[cs.class_id]) {
            teacherSubjects[cs.class_id] = [];
          }
          teacherSubjects[cs.class_id].push(cs.id);
        }
      });
      setSelectedSubjects(teacherSubjects);

      // Auto-expand classes that have assignments
      const classesWithAssignments = Object.keys(teacherSubjects);
      setExpandedClasses([...teacherClasses, ...classesWithAssignments]);
    }
  }, [classes, classSubjects, teacher]);

  // Mutation to update class teacher assignments
  const updateClassAssignment = useMutation({
    mutationFn: async ({ classId, teacherId }: { classId: string; teacherId: string | null }) => {
      const { error } = await supabase
        .from("classes")
        .update({ teacher_id: teacherId })
        .eq("id", classId);

      if (error) throw error;
    },
  });

  // Mutation to update subject teacher assignments
  const updateSubjectAssignment = useMutation({
    mutationFn: async ({ classSubjectId, teacherId }: { classSubjectId: string; teacherId: string | null }) => {
      const { error } = await supabase
        .from("class_subjects")
        .update({ teacher_id: teacherId })
        .eq("id", classSubjectId);

      if (error) throw error;
    },
  });

  const handleSave = async () => {
    if (!teacher || !classes || !classSubjects) return;

    try {
      // Handle class assignments
      const currentlyAssignedClasses = classes
        .filter((c) => c.teacher_id === teacher.id)
        .map((c) => c.id);

      const classesToAdd = selectedClasses.filter((id) => !currentlyAssignedClasses.includes(id));
      const classesToRemove = currentlyAssignedClasses.filter((id) => !selectedClasses.includes(id));

      for (const classId of classesToAdd) {
        await updateClassAssignment.mutateAsync({ classId, teacherId: teacher.id });
      }

      for (const classId of classesToRemove) {
        await updateClassAssignment.mutateAsync({ classId, teacherId: null });
      }

      // Handle subject assignments
      const currentlyAssignedSubjects = classSubjects
        .filter((cs) => cs.teacher_id === teacher.id)
        .map((cs) => cs.id);

      const allSelectedSubjects = Object.values(selectedSubjects).flat();
      
      const subjectsToAdd = allSelectedSubjects.filter((id) => !currentlyAssignedSubjects.includes(id));
      const subjectsToRemove = currentlyAssignedSubjects.filter((id) => !allSelectedSubjects.includes(id));

      for (const subjectId of subjectsToAdd) {
        await updateSubjectAssignment.mutateAsync({ classSubjectId: subjectId, teacherId: teacher.id });
      }

      for (const subjectId of subjectsToRemove) {
        await updateSubjectAssignment.mutateAsync({ classSubjectId: subjectId, teacherId: null });
      }

      queryClient.invalidateQueries({ queryKey: ["all-classes-for-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["class-subjects-for-teacher-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class-subjects"] });
      
      toast({ title: "Assignments updated successfully" });
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
    setSelectedClasses((prev) => {
      const isSelected = prev.includes(classId);
      if (isSelected) {
        // When deselecting a class, also deselect all its subjects
        setSelectedSubjects((prevSubjects) => {
          const newSubjects = { ...prevSubjects };
          delete newSubjects[classId];
          return newSubjects;
        });
        return prev.filter((id) => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  const toggleSubject = (classId: string, classSubjectId: string) => {
    setSelectedSubjects((prev) => {
      const classSubjectIds = prev[classId] || [];
      const isSelected = classSubjectIds.includes(classSubjectId);
      
      if (isSelected) {
        const newIds = classSubjectIds.filter((id) => id !== classSubjectId);
        if (newIds.length === 0) {
          const newSubjects = { ...prev };
          delete newSubjects[classId];
          return newSubjects;
        }
        return { ...prev, [classId]: newIds };
      } else {
        return { ...prev, [classId]: [...classSubjectIds, classSubjectId] };
      }
    });
  };

  const toggleExpanded = (classId: string) => {
    setExpandedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const getClassSubjectsForClass = (classId: string) => {
    return classSubjects?.filter((cs) => cs.class_id === classId) || [];
  };

  const isSubjectSelected = (classId: string, classSubjectId: string) => {
    return selectedSubjects[classId]?.includes(classSubjectId) || false;
  };

  const isSubjectAssignedToOther = (classSubject: any) => {
    return classSubject.teacher_id && classSubject.teacher_id !== teacher?.id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Assign Classes & Subjects to {teacher?.full_name}</DialogTitle>
          <DialogDescription>
            Select the classes and subjects this teacher will be responsible for. The teacher can only manage grades for their assigned subjects.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[450px] pr-4">
          {classesLoading ? (
            <p className="text-muted-foreground">Loading classes...</p>
          ) : classes && classes.length > 0 ? (
            <div className="space-y-3">
              {classes.map((cls) => {
                const isClassSelected = selectedClasses.includes(cls.id);
                const isClassAssignedToOther = cls.teacher_id && cls.teacher_id !== teacher?.id;
                const subjects = getClassSubjectsForClass(cls.id);
                const isExpanded = expandedClasses.includes(cls.id);
                const selectedSubjectCount = selectedSubjects[cls.id]?.length || 0;

                return (
                  <div
                    key={cls.id}
                    className={`border rounded-lg transition-colors ${
                      isClassSelected ? "border-primary bg-primary/5" : "border-border"
                    } ${isClassAssignedToOther ? "opacity-50" : ""}`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={cls.id}
                          checked={isClassSelected}
                          onCheckedChange={() => toggleClass(cls.id)}
                          disabled={isClassAssignedToOther}
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
                            {isClassAssignedToOther && (
                              <Badge variant="destructive" className="text-xs">
                                Assigned to another teacher
                              </Badge>
                            )}
                            {selectedSubjectCount > 0 && (
                              <Badge className="text-xs">
                                {selectedSubjectCount} subject{selectedSubjectCount > 1 ? "s" : ""} assigned
                              </Badge>
                            )}
                          </div>
                        </div>
                        {subjects.length > 0 && (
                          <Collapsible open={isExpanded}>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(cls.id)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        )}
                      </div>
                    </div>

                    {subjects.length > 0 && (
                      <Collapsible open={isExpanded}>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
                            <p className="text-sm font-medium text-muted-foreground py-2">
                              Assign subjects in this class:
                            </p>
                            <div className="space-y-2">
                              {subjects.map((cs) => {
                                const isSelected = isSubjectSelected(cls.id, cs.id);
                                const assignedToOther = isSubjectAssignedToOther(cs);

                                return (
                                  <div
                                    key={cs.id}
                                    className={`flex items-center gap-3 p-2 rounded ${
                                      isSelected ? "bg-primary/10" : ""
                                    } ${assignedToOther ? "opacity-50" : ""}`}
                                  >
                                    <Checkbox
                                      id={cs.id}
                                      checked={isSelected}
                                      onCheckedChange={() => toggleSubject(cls.id, cs.id)}
                                      disabled={assignedToOther}
                                    />
                                    <Label
                                      htmlFor={cs.id}
                                      className="text-sm cursor-pointer flex-1"
                                    >
                                      {cs.subject?.name} ({cs.subject?.code})
                                    </Label>
                                    {assignedToOther && (
                                      <Badge variant="outline" className="text-xs">
                                        Assigned to another
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
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
          <Button 
            onClick={handleSave} 
            disabled={updateClassAssignment.isPending || updateSubjectAssignment.isPending}
          >
            {updateClassAssignment.isPending || updateSubjectAssignment.isPending 
              ? "Saving..." 
              : "Save Assignments"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
