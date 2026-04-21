import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useClasses, useClassSubjects } from "@/hooks/useClasses";
import { useAllGradeLocks, useUpdateGradeLocks } from "@/hooks/useGradeLocks";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const PERIODS: { value: string; label: string }[] = [
  { value: "p1", label: "Period 1" },
  { value: "p2", label: "Period 2" },
  { value: "p3", label: "Period 3" },
  { value: "exam_s1", label: "Exam S1" },
  { value: "p4", label: "Period 4" },
  { value: "p5", label: "Period 5" },
  { value: "p6", label: "Period 6" },
  { value: "exam_s2", label: "Exam S2" },
];

const useAllClassSubjects = () => {
  return useQuery({
    queryKey: ["all-class-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_subjects")
        .select("id, class_id, subject_id, classes(id, name, department_id), subjects(id, name)");
      if (error) throw error;
      return data ?? [];
    },
  });
};

const useAllSubjects = () => {
  return useQuery({
    queryKey: ["all-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
};

const GradesRelease = () => {
  const [scope, setScope] = useState<"all" | "department" | "class">("all");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [period, setPeriod] = useState<string>("p1");

  const { data: classes } = useClasses();
  const { data: allCS } = useAllClassSubjects();
  const { data: locks } = useAllGradeLocks();
  const updateMutation = useUpdateGradeLocks();

  const departments = useMemo(() => {
    const seen = new Map<string, string>();
    classes?.forEach((c: any) => {
      const dId = c.department_id ?? c.departments?.id;
      const dName = c.departments?.name ?? "Department";
      if (dId && !seen.has(dId)) seen.set(dId, dName);
    });
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [classes]);

  const filteredCS = useMemo(() => {
    if (!allCS) return [];
    return (allCS as any[]).filter((cs) => {
      if (scope === "class" && classId) return cs.class_id === classId;
      if (scope === "department" && departmentId) return cs.classes?.department_id === departmentId;
      return true;
    });
  }, [allCS, scope, classId, departmentId]);

  const lockMap = useMemo(() => {
    const m = new Map<string, { is_locked: boolean; is_released: boolean }>();
    (locks ?? []).forEach((l) => {
      m.set(`${l.class_subject_id}:${l.period}`, {
        is_locked: l.is_locked,
        is_released: l.is_released,
      });
    });
    return m;
  }, [locks]);

  const targets = filteredCS.map((cs: any) => ({ classSubjectId: cs.id, period }));

  const apply = (changes: { is_locked?: boolean; is_released?: boolean }) =>
    updateMutation.mutate({ targets, changes });

  return (
    <AppShell activeTab="grades-release">
      <div className="py-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">Grade Release & Locks</h1>
          <p className="text-muted-foreground text-sm">
            Release grades to students/parents and lock periods to prevent teacher edits.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Scope</CardTitle>
            <CardDescription>Choose which class subjects to apply changes to.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={scope} onValueChange={(v: any) => setScope(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                <SelectItem value="department">By department</SelectItem>
                <SelectItem value="class">Specific class</SelectItem>
              </SelectContent>
            </Select>

            {scope === "department" && (
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {scope === "class" && (
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => apply({ is_released: true })} disabled={!targets.length || updateMutation.isPending} className="gap-1">
                <Eye className="h-4 w-4" /> Release
              </Button>
              <Button size="sm" variant="outline" onClick={() => apply({ is_released: false })} disabled={!targets.length || updateMutation.isPending} className="gap-1">
                <EyeOff className="h-4 w-4" /> Unrelease
              </Button>
              <Button size="sm" variant="secondary" onClick={() => apply({ is_locked: true })} disabled={!targets.length || updateMutation.isPending} className="gap-1">
                <Lock className="h-4 w-4" /> Lock
              </Button>
              <Button size="sm" variant="outline" onClick={() => apply({ is_locked: false })} disabled={!targets.length || updateMutation.isPending} className="gap-1">
                <Unlock className="h-4 w-4" /> Unlock
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Affected Class Subjects ({filteredCS.length}) — {PERIODS.find(p=>p.value===period)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Lock</TableHead>
                    <TableHead className="text-center">Released</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCS.map((cs: any) => {
                    const status = lockMap.get(`${cs.id}:${period}`);
                    return (
                      <TableRow key={cs.id}>
                        <TableCell>{cs.classes?.name ?? "-"}</TableCell>
                        <TableCell>{cs.subjects?.name ?? "-"}</TableCell>
                        <TableCell className="text-center">
                          {status?.is_locked ? (
                            <Badge variant="destructive" className="gap-1"><Lock className="h-3 w-3" />Locked</Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1"><Unlock className="h-3 w-3" />Open</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {status?.is_released ? (
                            <Badge className="gap-1"><Eye className="h-3 w-3" />Released</Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1"><EyeOff className="h-3 w-3" />Hidden</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredCS.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No class subjects in scope.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default GradesRelease;
