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
import { ChevronDown, ChevronRight, UserCheck } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SponsorAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    user_id: string;
    full_name: string;
  } | null;
}

export const SponsorAssignmentDialog = ({
  open,
  onOpenChange,
  user,
}: SponsorAssignmentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);

  // Fetch all classes grouped by department
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["all-classes-for-sponsor-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          department_id,
          departments(id, name),
          academic_years(year_name)
        `)
        .order("name");

      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: open,
  });

  // Fetch existing sponsor assignments for this user
  const { data: existingAssignments } = useQuery({
    queryKey: ["sponsor-assignments-for-user", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return [];
      
      const { data, error } = await supabase
        .from("sponsor_class_assignments")
        .select("class_id")
        .eq("user_id", user.user_id);
      
      if (error) {
        console.error("Error fetching sponsor assignments:", error);
        return [];
      }
      return data?.map((a: any) => a.class_id) || [];
    },
    enabled: open && !!user,
  });

  // Initialize selected classes when dialog opens
  useEffect(() => {
    if (existingAssignments) {
      setSelectedClasses(existingAssignments);
      // Expand all departments
      if (classes) {
        const departments = [...new Set((classes as any[]).map((c) => c.department_id))].filter(Boolean) as string[];
        setExpandedDepartments(departments);
      }
    }
  }, [existingAssignments, classes]);

  // Mutation to assign classes
  const assignMutation = useMutation({
    mutationFn: async (classIds: string[]) => {
      if (!user?.user_id) return;

      // Delete all existing assignments
      const { error: deleteError } = await supabase
        .from("sponsor_class_assignments")
        .delete()
        .eq("user_id", user.user_id);

      if (deleteError) throw new Error("Failed to delete existing assignments: " + deleteError.message);

      // Insert new assignments
      if (classIds.length > 0) {
        const { error: insertError } = await supabase
          .from("sponsor_class_assignments")
          .insert(
            classIds.map((classId) => ({
              user_id: user.user_id,
              class_id: classId,
            }))
          );

        if (insertError) throw new Error("Failed to insert new assignments: " + insertError.message);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sponsor class assignments updated",
      });
      queryClient.invalidateQueries({ queryKey: ["sponsor-assignments"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sponsor assignments",
        variant: "destructive",
      });
    },
  });

  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const toggleDepartment = (departmentId: string) => {
    setExpandedDepartments((prev) =>
      prev.includes(departmentId) ? prev.filter((id) => id !== departmentId) : [...prev, departmentId]
    );
  };

  // Group classes by department
  const groupedClasses: Record<string, any[]> = {};
  if (classes) {
    (classes as any[]).forEach((cls) => {
      const deptId = cls.department_id || "unknown";
      if (!groupedClasses[deptId]) {
        groupedClasses[deptId] = [];
      }
      groupedClasses[deptId].push(cls);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assign Classes as Sponsor
          </DialogTitle>
          <DialogDescription>
            {user ? `${user.full_name} - Select classes to sponsor` : "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {classesLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Loading classes...</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="space-y-4">
                {Object.entries(groupedClasses).map(([departmentId, deptClasses]) => {
                  const deptName = deptClasses?.[0]?.departments?.name || "Uncategorized";
                  const isExpanded = expandedDepartments.includes(departmentId);

                  return (
                    <Collapsible
                      key={departmentId}
                      open={isExpanded}
                      onOpenChange={() => toggleDepartment(departmentId)}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 hover:bg-accent p-2 rounded-md w-full">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-semibold">{deptName}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {deptClasses?.filter((c) => selectedClasses.includes(c.id)).length}/
                          {deptClasses?.length}
                        </Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-6 mt-2 space-y-2">
                        {deptClasses?.map((cls) => (
                          <div key={cls.id} className="flex items-center gap-2 p-2 hover:bg-accent rounded-md">
                            <Checkbox
                              id={cls.id}
                              checked={selectedClasses.includes(cls.id)}
                              onCheckedChange={() => toggleClass(cls.id)}
                            />
                            <Label
                              htmlFor={cls.id}
                              className="cursor-pointer flex-1 font-normal"
                            >
                              {cls.name}
                              <span className="text-xs text-muted-foreground ml-2">
                                ({cls.academic_years?.year_name})
                              </span>
                            </Label>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => assignMutation.mutate(selectedClasses)}
                disabled={assignMutation.isPending}
              >
                {assignMutation.isPending ? "Saving..." : "Save Sponsor Assignments"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
