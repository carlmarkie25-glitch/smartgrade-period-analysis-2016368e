import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type SubjectForm = {
  name: string;
  code: string;
  description: string;
  department_id: string | null;
};

const EMPTY_FORM: SubjectForm = { name: "", code: "", description: "", department_id: null };

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
    queryKey: ["subjects-with-dept"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*, departments(id, name, display_order)")
        .order("name");
      if (error) throw error;
      // Sort by department display_order, then dept name, then subject name
      return [...(data ?? [])].sort((a: any, b: any) => {
        const da = a.departments?.display_order ?? 9999;
        const db = b.departments?.display_order ?? 9999;
        if (da !== db) return da - db;
        const dna = a.departments?.name ?? "zzz";
        const dnb = b.departments?.name ?? "zzz";
        if (dna !== dnb) return dna.localeCompare(dnb);
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
      department_id: subject.department_id ?? null,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Please enter a subject name", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || null,
        department_id: form.department_id || null,
      };

      const { error } = editingId
        ? await supabase.from("subjects").update(payload).eq("id", editingId)
        : await supabase.from("subjects").insert(payload);
      if (error) throw error;

      toast({
        title: "Success",
        description: editingId ? "Subject updated successfully" : "Subject added successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["subjects-with-dept"] });
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
      queryClient.invalidateQueries({ queryKey: ["subjects-with-dept"] });
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
                <Label htmlFor="department">Department</Label>
                <Select
                  value={form.department_id ?? "none"}
                  onValueChange={(v) => setForm({ ...form, department_id: v === "none" ? null : v })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <TableHead>Department</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects?.map((subject: any) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>{subject.code}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {subject.departments?.name ?? <span className="italic">Unassigned</span>}
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
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
