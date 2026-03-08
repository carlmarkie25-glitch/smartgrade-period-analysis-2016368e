import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClassScheduleEntry, useClassSchedules } from "@/hooks/useClassSchedules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Pencil, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const ClassScheduleManagementTab = () => {
  const { data: schedules, isLoading } = useClassSchedules();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [form, setForm] = useState<Partial<ClassScheduleEntry>>({
    class_id: "",
    teacher_id: null,
    day_of_week: 1,
    start_time: "",
    end_time: "",
    subject_id: null,
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });
  const { data: teachers } = useQuery({
    queryKey: ["teachers-for-schedules"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");
      if (rolesError) throw rolesError;
      const ids = roles?.map((r) => r.user_id) || [];
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("user_id", ids)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleSave = async () => {
    try {
      if (form.id) {
        const { error } = await supabase
          .from("class_schedules" as any)
          .update(form as Partial<ClassScheduleEntry>)
          .eq("id", form.id as string);
        if (error) throw error;
      } else {
        // ensure required fields are present
        const newEntry = {
          class_id: form.class_id!,
          day_of_week: form.day_of_week!,
          start_time: form.start_time!,
          end_time: form.end_time!,
          teacher_id: form.teacher_id || null,
          subject_id: form.subject_id || null,
        };
        const { error } = await supabase.from("class_schedules" as any).insert(newEntry);
        if (error) throw error;
      }
      toast({ title: "Success", description: "Schedule saved" });
      queryClient.invalidateQueries({ queryKey: ["class-schedules"] });
      setIsDialogOpen(false);
      setForm({ class_id: "", teacher_id: null, day_of_week: 1, start_time: "", end_time: "", subject_id: null });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      const { error } = await supabase.from("class_schedules" as any).delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted" });
      queryClient.invalidateQueries({ queryKey: ["class-schedules"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const openNew = () => {
    setForm({ class_id: "", teacher_id: null, day_of_week: 1, start_time: "", end_time: "", subject_id: null });
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Add Entry
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Class Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))
                : schedules?.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.classes?.name}</TableCell>
                      <TableCell>{days[entry.day_of_week]}</TableCell>
                      <TableCell>
                        {entry.start_time} - {entry.end_time}
                      </TableCell>
                      <TableCell>{entry.teachers?.full_name || ""}</TableCell>
                      <TableCell>{entry.subjects?.name || ""}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => {
                            setForm(entry);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit" : "Add"} Schedule Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Class</Label>
              <Select
                value={form.class_id}
                onValueChange={(val) => setForm({ ...form, class_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher</Label>
              <Select
                value={form.teacher_id || ""}
                onValueChange={(val) => setForm({ ...form, teacher_id: val || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {teachers?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select
                value={form.subject_id || ""}
                onValueChange={(val) => setForm({ ...form, subject_id: val || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Day of Week</Label>
              <Select
                value={String(form.day_of_week)}
                onValueChange={(val) => setForm({ ...form, day_of_week: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.start_time || ""}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.end_time || ""}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>{form.id ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
