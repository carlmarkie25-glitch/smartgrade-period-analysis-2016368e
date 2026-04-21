import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";

const AcademicYearsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    year_name: "",
    start_date: "",
    end_date: "",
    is_current: false,
  });

  const { data: years, isLoading } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleCreate = async () => {
    if (!form.year_name || !form.start_date || !form.end_date) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("academic_years").insert(form);
    if (error) {
      toast({ title: "Error creating academic year", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Academic year created successfully" });
      setForm({ year_name: "", start_date: "", end_date: "", is_current: false });
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;
    const { error } = await supabase.from("academic_years").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Academic year deleted" });
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    }
  };

  const handleSetCurrent = async (id: string) => {
    // Unset all, then set the selected one
    await supabase.from("academic_years").update({ is_current: false }).neq("id", "");
    const { error } = await supabase.from("academic_years").update({ is_current: true }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Current academic year updated" });
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    }
  };

  return (
    <AppShell activeTab="years">
      <div className="py-4">
        <div className="neu-card p-6 mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Academic Years</h1>
            <p className="text-muted-foreground text-sm">Manage academic years and set the current active year</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/year-rollover"><RotateCw className="h-4 w-4 mr-2" /> Year Rollover</Link>
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Academic Year</CardTitle>
              <CardDescription>Add a new academic year to the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Year Name</Label>
                <Input
                  placeholder="2024-2025"
                  value={form.year_name}
                  onChange={(e) => setForm({ ...form, year_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCreate}>Create Academic Year</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Academic Years</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : years && years.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {years.map((year) => (
                      <TableRow key={year.id}>
                        <TableCell className="font-medium">{year.year_name}</TableCell>
                        <TableCell>{year.start_date}</TableCell>
                        <TableCell>{year.end_date}</TableCell>
                        <TableCell>
                          {year.is_current ? (
                            <Badge>Current</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetCurrent(year.id)}
                            >
                              Set Current
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(year.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No academic years created yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default AcademicYearsPage;
