import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useClasses } from "@/hooks/useClasses";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const ClassManagementTab = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubjectsDialogOpen, setIsSubjectsDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [newClass, setNewClass] = useState({
    name: "",
    department_id: "",
    academic_year_id: "",
  });

  const { data: classes, isLoading } = useClasses();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departments } = useQuery({
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

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("year_name", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: classSubjects } = useQuery({
    queryKey: ["class-subjects", selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const { data, error } = await supabase
        .from("class_subjects")
        .select("*, subjects(name, code)")
        .eq("class_id", selectedClassId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClassId,
  });

  const handleAddClass = async () => {
    try {
      const { error } = await supabase.from("classes").insert(newClass);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Class added successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsAddDialogOpen(false);
      setNewClass({
        name: "",
        department_id: "",
        academic_year_id: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Class deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["classes"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddSubjectToClass = async () => {
    if (!selectedClassId || !selectedSubjectId) return;

    try {
      const { error } = await supabase.from("class_subjects").insert({
        class_id: selectedClassId,
        subject_id: selectedSubjectId,
      });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject added to class successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["class-subjects", selectedClassId] });
      setSelectedSubjectId("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveSubjectFromClass = async (classSubjectId: string) => {
    if (!confirm("Remove this subject from the class?")) return;

    try {
      const { error } = await supabase
        .from("class_subjects")
        .delete()
        .eq("id", classSubjectId);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject removed from class",
      });

      queryClient.invalidateQueries({ queryKey: ["class-subjects", selectedClassId] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Class Management</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder="e.g., Grade 10A"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={newClass.department_id} onValueChange={(value) => setNewClass({ ...newClass, department_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="academic_year">Academic Year</Label>
                <Select value={newClass.academic_year_id} onValueChange={(value) => setNewClass({ ...newClass, academic_year_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears?.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year_name} {year.is_current && "(Current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddClass} className="w-full">
                Add Class
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes?.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>
                    {cls.departments?.name} ({cls.departments?.type})
                  </TableCell>
                  <TableCell>{cls.academic_years?.year_name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setIsSubjectsDialogOpen(true);
                        }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClass(cls.id)}
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

      <Dialog open={isSubjectsDialogOpen} onOpenChange={setIsSubjectsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Class Subjects</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddSubjectToClass} disabled={!selectedSubjectId}>
                Add Subject
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classSubjects?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No subjects assigned to this class yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    classSubjects?.map((cs) => (
                      <TableRow key={cs.id}>
                        <TableCell className="font-medium">{cs.subjects?.name}</TableCell>
                        <TableCell>{cs.subjects?.code}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveSubjectFromClass(cs.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
