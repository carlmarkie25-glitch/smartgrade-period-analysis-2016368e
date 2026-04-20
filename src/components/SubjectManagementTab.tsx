import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type SubjectForm = {
  name: string;
  code: string;
  description: string;
  department_ids: string[];
};

const EMPTY_FORM: SubjectForm = { name: "", code: "", description: "", department_ids: [] };

export const SubjectManagementTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubjectForm>(EMPTY_FORM);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departments } = useQuery({
    queryKey: ["departments-for-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, display_order")
        .order("display_order")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects-with-depts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*, subject_departments(department_id, departments(id, name, display_order))")
        .order("name");
      if (error) throw error;
      // Sort by lowest department display_order across the subject's departments
      return [...(data ?? [])].sort((a: any, b: any) => {
        const minOrder = (s: any) => {
          const orders = (s.subject_departments ?? [])
            .map((sd: any) => sd.departments?.display_order)
            .filter((n: any) => typeof n === "number");
          return orders.length ? Math.min(...orders) : 9999;
        };
        const da = minOrder(a);
        const db = minOrder(b);
        if (da !== db) return da - db;
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
    },
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = (subject: any) => {
    setEditingId(subject.id);
    setForm({
      name: subject.name ?? "",
      code: subject.code ?? "",
      description: subject.description ?? "",
      department_ids: (subject.subject_departments ?? []).map((sd: any) => sd.department_id),
    });
    setIsDialogOpen(true);
  };

  const toggleDept = (id: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      department_ids: checked
        ? Array.from(new Set([...prev.department_ids, id]))
        : prev.department_ids.filter((d) => d !== id),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Please enter a subject name", variant: "destructive" });
      return;
    }
    try {
      const payload: any = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || null,
        // Keep legacy single column in sync with the first selected dept (best-effort)
        department_id: form.department_ids[0] ?? null,
      };

      let subjectId = editingId;
      if (editingId) {
        const { error } = await supabase.from("subjects").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("subjects").insert(payload).select("id").single();
        if (error) throw error;
        subjectId = data.id;
      }

      // Replace department links
      if (subjectId) {
        const { error: delErr } = await supabase
          .from("subject_departments")
          .delete()
          .eq("subject_id", subjectId);
        if (delErr) throw delErr;

        if (form.department_ids.length > 0) {
          const rows = form.department_ids.map((department_id) => ({
            subject_id: subjectId!,
            department_id,
          }));
          const { error: insErr } = await supabase.from("subject_departments").insert(rows);
          if (insErr) throw insErr;
        }
      }

      toast({
        title: "Success",
        description: editingId ? "Subject updated successfully" : "Subject added successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["subjects-with-depts"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setIsDialogOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;

    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Success", description: "Subject deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["subjects-with-depts"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Subject Management</CardTitle>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setForm(EMPTY_FORM);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openAdd}>
              <BookOpen className="h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Subject" : "Add New Subject"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g., MATH101"
                />
              </div>
              <div>
                <Label>Departments</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select one or more departments this subject belongs to.
                </p>
                <div className="max-h-48 overflow-y-auto rounded-md border p-3 space-y-2">
                  {departments?.length ? (
                    departments.map((d: any) => (
                      <label
                        key={d.id}
                        className="flex items-center gap-2 cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={(form.department_ids ?? []).includes(d.id)}
                          onCheckedChange={(checked) => toggleDept(d.id, checked === true)}
                        />
                        <span>{d.name}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No departments available</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the subject"
                  rows={3}
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingId ? "Save Changes" : "Add Subject"}
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
                <TableHead>Subject Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Departments</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects?.map((subject: any) => {
                const depts = (subject.subject_departments ?? [])
                  .map((sd: any) => sd.departments)
                  .filter(Boolean)
                  .sort(
                    (a: any, b: any) =>
                      (a.display_order ?? 9999) - (b.display_order ?? 9999) ||
                      a.name.localeCompare(b.name),
                  );
                return (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.code}</TableCell>
                    <TableCell>
                      {depts.length ? (
                        <div className="flex flex-wrap gap-1">
                          {depts.map((d: any) => (
                            <Badge key={d.id} variant="secondary">
                              {d.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {subject.description || "No description"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(subject)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSubject(subject.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
