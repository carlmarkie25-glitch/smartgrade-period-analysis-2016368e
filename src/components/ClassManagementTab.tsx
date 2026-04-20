import { useState, useEffect, useMemo } from "react";
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
import { Pencil, Trash2, Plus, BookOpen, UserCheck, GripVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableClassRow = ({ id, children }: { id: string; children: (handleProps: any) => React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <TableRow ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </TableRow>
  );
};

export const ClassManagementTab = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubjectsDialogOpen, setIsSubjectsDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [editingClass, setEditingClass] = useState<{ id: string; name: string; department_id: string; academic_year_id: string; grading_mode: "numbers" | "letters" } | null>(null);
  const [newClass, setNewClass] = useState<{
    name: string;
    department_id: string;
    academic_year_id: string;
    grading_mode: "numbers" | "letters";
  }>({
    name: "",
    department_id: "",
    academic_year_id: "",
    grading_mode: "numbers",
  });

  const { data: classes, isLoading } = useClasses();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Local order state mirrors `classes` so drag reorder feels instant
  const [orderedClasses, setOrderedClasses] = useState<any[]>([]);
  useEffect(() => {
    if (classes) setOrderedClasses(classes as any[]);
  }, [classes]);

  // Group classes by department for grouped rendering
  const groupedByDept = useMemo(() => {
    const groups = new Map<string, { name: string; order: number; items: any[] }>();
    for (const c of orderedClasses) {
      const id = c.department_id;
      const name = c.departments?.name ?? "—";
      const order = c.departments?.display_order ?? 9999;
      if (!groups.has(id)) groups.set(id, { name, order, items: [] });
      groups.get(id)!.items.push(c);
    }
    return [...groups.entries()]
      .map(([id, g]) => ({ id, ...g }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }, [orderedClasses]);

  const handleDragEnd = async (deptId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const group = groupedByDept.find((g) => g.id === deptId);
    if (!group) return;
    const oldIndex = group.items.findIndex((c) => c.id === active.id);
    const newIndex = group.items.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(group.items, oldIndex, newIndex);

    // Rebuild orderedClasses with the new in-department order
    const next = orderedClasses.map((c) => c);
    const otherIds = next.filter((c) => c.department_id !== deptId);
    const merged = [...otherIds, ...reordered].sort((a, b) => {
      const da = a.departments?.display_order ?? 9999;
      const db = b.departments?.display_order ?? 9999;
      if (da !== db) return da - db;
      return 0;
    });
    // Place reordered group items in their new positions
    const finalList: any[] = [];
    for (const g of groupedByDept) {
      if (g.id === deptId) finalList.push(...reordered);
      else finalList.push(...g.items);
    }
    setOrderedClasses(finalList);

    try {
      await Promise.all(
        reordered.map((c, i) =>
          supabase.from("classes").update({ display_order: (i + 1) * 10 }).eq("id", c.id),
        ),
      );
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Order saved", description: `Updated class order in ${group.name}.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("display_order")
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

  // Fetch teachers (profiles with teacher role)
  const { data: teachers } = useQuery({
    queryKey: ["teachers-for-sponsor"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");
      if (rolesError) throw rolesError;

      const teacherUserIds = roles?.map(r => r.user_id) || [];
      if (teacherUserIds.length === 0) return [];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name")
        .in("user_id", teacherUserIds)
        .order("full_name");
      if (error) throw error;
      return profiles;
    },
  });

  const handleAssignSponsor = async (classId: string, teacherUserId: string | null) => {
    try {
      const { error } = await supabase
        .from("classes")
        .update({ teacher_id: teacherUserId })
        .eq("id", classId);
      if (error) throw error;

      toast({
        title: "Success",
        description: teacherUserId ? "Sponsor assigned successfully" : "Sponsor removed",
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
        grading_mode: "numbers",
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

      toast({ title: "Success", description: "Class deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditClass = async () => {
    if (!editingClass) return;
    try {
      // Detect "structural" changes that invalidate existing grades:
      // - department change → assessment types differ (KG vs Junior High vs Senior High)
      // - grading mode change → numeric vs letter scale
      const original = classes?.find((c: any) => c.id === editingClass.id);
      const deptChanged = !!original && original.department_id !== editingClass.department_id;
      const modeChanged = !!original && (original as any).grading_mode !== editingClass.grading_mode;

      if (deptChanged || modeChanged) {
        const what = deptChanged && modeChanged
          ? "department and grading mode"
          : deptChanged ? "department" : "grading mode";
        const ok = confirm(
          `Changing the ${what} for this class will permanently DELETE all existing ` +
          `grades, period totals, and subject assignments for this class so the ` +
          `gradebook can restart cleanly with the new assessment structure.\n\n` +
          `This cannot be undone. Continue?`
        );
        if (!ok) return;

        // Find class_subject ids for this class so we can wipe their grades.
        const { data: csRows, error: csErr } = await supabase
          .from("class_subjects")
          .select("id")
          .eq("class_id", editingClass.id);
        if (csErr) throw csErr;
        const csIds = (csRows ?? []).map((r: any) => r.id);

        if (csIds.length > 0) {
          // Wipe grades + cached totals tied to those class_subjects, then
          // remove the class_subjects so admin re-adds them under the new
          // department's assessment scheme.
          const { error: gErr } = await supabase
            .from("student_grades")
            .delete()
            .in("class_subject_id", csIds);
          if (gErr) throw gErr;

          const { error: ptErr } = await supabase
            .from("student_period_totals")
            .delete()
            .in("class_subject_id", csIds);
          if (ptErr) throw ptErr;

          const { error: ytErr } = await supabase
            .from("student_yearly_totals")
            .delete()
            .in("class_subject_id", csIds);
          if (ytErr) throw ytErr;

          const { error: csDelErr } = await supabase
            .from("class_subjects")
            .delete()
            .in("id", csIds);
          if (csDelErr) throw csDelErr;
        }
      }

      const { error } = await supabase
        .from("classes")
        .update({
          name: editingClass.name,
          department_id: editingClass.department_id,
          academic_year_id: editingClass.academic_year_id,
          grading_mode: editingClass.grading_mode,
        })
        .eq("id", editingClass.id);
      if (error) throw error;

      toast({
        title: "Success",
        description: (deptChanged || modeChanged)
          ? "Class updated. Old grades cleared — re-add subjects to start fresh."
          : "Class updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      queryClient.invalidateQueries({ queryKey: ["student-report"] });
      queryClient.invalidateQueries({ queryKey: ["assessment-types"] });
      setIsEditDialogOpen(false);
      setEditingClass(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
                        {dept.name}
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
              <div>
                <Label htmlFor="grading_mode">Grading System</Label>
                <Select
                  value={newClass.grading_mode}
                  onValueChange={(value: "numbers" | "letters") => setNewClass({ ...newClass, grading_mode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numbers">Numbers (Grades 1–12, K1, K2)</SelectItem>
                    <SelectItem value="letters">Letters (Nursery, ABC — A+ to F)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Letters mode uses a single "Total Points" assessment and shows letter grades only on reports.
                </p>
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
          <div className="space-y-6">
            <p className="text-xs text-muted-foreground">
              Drag the handle <GripVertical className="inline h-3 w-3" /> to reorder classes within a department.
              Departments themselves are reordered in the Departments page.
            </p>
            {groupedByDept.map((group) => (
              <div key={group.id}>
                <h3 className="text-sm font-semibold text-foreground mb-2 px-2">{group.name}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Sponsor</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(group.id, e)}
                  >
                    <SortableContext items={group.items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                      <TableBody>
                        {group.items.map((cls) => (
                          <SortableClassRow key={cls.id} id={cls.id}>
                            {({ attributes, listeners }) => (
                              <>
                                <TableCell className="w-10">
                                  <button
                                    type="button"
                                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                                    {...attributes}
                                    {...listeners}
                                    aria-label="Drag to reorder"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </button>
                                </TableCell>
                                <TableCell className="font-medium">{cls.name}</TableCell>
                                <TableCell>{cls.academic_years?.year_name}</TableCell>
                                <TableCell>
                                  <Select
                                    value={cls.teacher_id || "none"}
                                    onValueChange={(value) => handleAssignSponsor(cls.id, value === "none" ? null : value)}
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue placeholder="Assign sponsor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No Sponsor</SelectItem>
                                      {teachers?.map((teacher) => (
                                        <SelectItem key={teacher.user_id} value={teacher.user_id}>
                                          {teacher.full_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {cls.teacher_id && (
                                    <Badge variant="secondary" className="mt-1 gap-1">
                                      <UserCheck className="h-3 w-3" />
                                      {teachers?.find((t) => t.user_id === cls.teacher_id)?.full_name || "Assigned"}
                                    </Badge>
                                  )}
                                </TableCell>
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
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingClass({
                                          id: cls.id,
                                          name: cls.name,
                                          department_id: cls.department_id,
                                          academic_year_id: cls.academic_year_id,
                                          grading_mode: ((cls as any).grading_mode === "letters" ? "letters" : "numbers"),
                                        });
                                        setIsEditDialogOpen(true);
                                      }}
                                    >
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
                              </>
                            )}
                          </SortableClassRow>
                        ))}
                      </TableBody>
                    </SortableContext>
                  </DndContext>
                </Table>
              </div>
            ))}
          </div>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          {editingClass && (
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="edit-name">Class Name</Label>
                <Input
                  id="edit-name"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-department">Department</Label>
                <Select value={editingClass.department_id} onValueChange={(value) => setEditingClass({ ...editingClass, department_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-year">Academic Year</Label>
                <Select value={editingClass.academic_year_id} onValueChange={(value) => setEditingClass({ ...editingClass, academic_year_id: value })}>
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
              <div>
                <Label htmlFor="edit-grading-mode">Grading System</Label>
                <Select
                  value={editingClass.grading_mode}
                  onValueChange={(value: "numbers" | "letters") => setEditingClass({ ...editingClass, grading_mode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numbers">Numbers (Grades 1–12, K1, K2)</SelectItem>
                    <SelectItem value="letters">Letters (Nursery, ABC — A+ to F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditClass} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
