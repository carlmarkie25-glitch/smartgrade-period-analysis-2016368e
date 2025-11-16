import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const DepartmentManagementTab = () => {
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
  });
  const [newAssessment, setNewAssessment] = useState({
    name: "",
    max_points: 100,
    display_order: 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departments, isLoading: deptLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: assessments, isLoading: assessmentLoading } = useQuery({
    queryKey: ["assessment-types", selectedDepartmentId],
    queryFn: async () => {
      if (!selectedDepartmentId) return [];
      const { data, error } = await supabase
        .from("assessment_types")
        .select("*")
        .eq("department_id", selectedDepartmentId)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDepartmentId,
  });

  const handleAddDepartment = async () => {
    try {
      const { error } = await supabase.from("departments").insert(newDepartment);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Department created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsDeptDialogOpen(false);
      setNewDepartment({ name: "", description: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department? This will also delete all associated assessments.")) return;

    try {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Department deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["departments"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddAssessment = async () => {
    try {
      const { error } = await supabase.from("assessment_types").insert({
        ...newAssessment,
        department_id: selectedDepartmentId,
      });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Assessment type added successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["assessment-types", selectedDepartmentId] });
      setNewAssessment({ name: "", max_points: 100, display_order: 0 });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assessment type?")) return;

    try {
      const { error } = await supabase.from("assessment_types").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Assessment type deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["assessment-types", selectedDepartmentId] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Departments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Manage school departments and their assessment types</CardDescription>
            </div>
            <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Department</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dept_name">Department Name</Label>
                    <Input
                      id="dept_name"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                      placeholder="e.g., Elementary, Junior High, Senior High"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dept_description">Description (Optional)</Label>
                    <Textarea
                      id="dept_description"
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                      placeholder="Brief description of the department"
                    />
                  </div>
                  <Button onClick={handleAddDepartment} className="w-full">
                    Create Department
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {deptLoading ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments?.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{dept.description || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDepartmentId(dept.id);
                            setIsAssessmentDialogOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Assessments
                        </Button>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDepartment(dept.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assessment Types Dialog */}
      <Dialog open={isAssessmentDialogOpen} onOpenChange={setIsAssessmentDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Assessment Types - {departments?.find(d => d.id === selectedDepartmentId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Assessment Name</Label>
                <Input
                  value={newAssessment.name}
                  onChange={(e) => setNewAssessment({ ...newAssessment, name: e.target.value })}
                  placeholder="e.g., Quiz 1"
                />
              </div>
              <div>
                <Label>Max Points</Label>
                <Input
                  type="number"
                  value={newAssessment.max_points}
                  onChange={(e) => setNewAssessment({ ...newAssessment, max_points: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={newAssessment.display_order}
                  onChange={(e) => setNewAssessment({ ...newAssessment, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <Button onClick={handleAddAssessment} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Assessment Type
            </Button>

            {assessmentLoading ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Assessment Name</TableHead>
                    <TableHead>Max Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments?.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell>{assessment.display_order}</TableCell>
                      <TableCell className="font-medium">{assessment.name}</TableCell>
                      <TableCell>{assessment.max_points}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAssessment(assessment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
