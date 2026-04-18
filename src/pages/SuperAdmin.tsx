import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { impersonation } from "@/lib/impersonation";
import { Eye, ShieldAlert, ShieldCheck, Search, FileText } from "lucide-react";
import { SchoolDetailDrawer } from "@/components/SchoolDetailDrawer";

type School = {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  subscription_status: string;
  subscription_plan: string;
  lockout_state: string;
  lockout_started_at: string | null;
  trial_ends_at: string | null;
  max_students: number;
  billable_student_count: number;
  created_at: string;
  owner_user_id: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  country: string | null;
};

type AuditLog = {
  id: string;
  school_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: any;
  created_at: string;
};

const lockColor: Record<string, string> = {
  none: "bg-success/15 text-success",
  soft: "bg-warning/15 text-warning",
  hard: "bg-destructive/15 text-destructive",
};

const SuperAdmin = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<School | null>(null);
  const [editForm, setEditForm] = useState({
    subscription_tier: "",
    subscription_status: "",
    max_students: 0,
    trial_ends_at: "",
  });
  const [viewing, setViewing] = useState<School | null>(null);

  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ["super-admin-schools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select(
          "id,name,slug,subscription_tier,subscription_status,subscription_plan,lockout_state,lockout_started_at,trial_ends_at,max_students,billable_student_count,created_at,owner_user_id,email,phone,website,address,country"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as School[];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return schools ?? [];
    const q = search.toLowerCase();
    return (schools ?? []).filter(
      (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
  }, [schools, search]);

  const { data: auditLogs } = useQuery({
    queryKey: ["super-admin-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
  });

  const setLockout = async (s: School, state: "none" | "soft" | "hard") => {
    const { error } = await supabase
      .from("schools")
      .update({
        lockout_state: state,
        lockout_started_at: state === "none" ? null : new Date().toISOString(),
      })
      .eq("id", s.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.rpc("write_audit_log" as any, {
      p_action: `school.lockout.${state}`,
      p_entity_type: "school",
      p_entity_id: s.id,
      p_metadata: { school_name: s.name } as any,
    });
    toast({ title: "Updated", description: `${s.name} → lockout: ${state}` });
    qc.invalidateQueries({ queryKey: ["super-admin-schools"] });
    qc.invalidateQueries({ queryKey: ["super-admin-audit"] });
  };

  const openEdit = (s: School) => {
    setEditing(s);
    setEditForm({
      subscription_tier: s.subscription_tier,
      subscription_status: s.subscription_status,
      max_students: s.max_students,
      trial_ends_at: s.trial_ends_at ? s.trial_ends_at.slice(0, 10) : "",
    });
  };

  const saveOverrides = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("schools")
      .update({
        subscription_tier: editForm.subscription_tier,
        subscription_status: editForm.subscription_status,
        max_students: Number(editForm.max_students) || 0,
        trial_ends_at: editForm.trial_ends_at
          ? new Date(editForm.trial_ends_at).toISOString()
          : null,
      })
      .eq("id", editing.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.rpc("write_audit_log" as any, {
      p_action: "school.subscription_override",
      p_entity_type: "school",
      p_entity_id: editing.id,
      p_metadata: editForm as any,
    });
    toast({ title: "Saved", description: `${editing.name} updated` });
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["super-admin-schools"] });
    qc.invalidateQueries({ queryKey: ["super-admin-audit"] });
  };

  const impersonate = (s: School) => {
    impersonation.set(s.id, s.name);
    toast({ title: "Impersonating", description: `Now viewing as ${s.name}` });
    navigate("/dashboard");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" /> Super Admin
        </h1>
        <p className="text-muted-foreground">
          Manage all schools, lockouts, subscription overrides and audit history.
        </p>
      </div>

      <Tabs defaultValue="schools">
        <TabsList>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="lockout">Lockouts</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        {/* SCHOOLS */}
        <TabsContent value="schools" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>All schools ({schools?.length ?? 0})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search by name or slug"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {schoolsLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>School</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Lockout</TableHead>
                        <TableHead className="text-right">Seats</TableHead>
                        <TableHead>Trial ends</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-muted-foreground">{s.slug}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{s.subscription_tier}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{s.subscription_status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={lockColor[s.lockout_state] ?? ""}>
                              {s.lockout_state}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {s.billable_student_count}/{s.max_students}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {s.trial_ends_at
                              ? new Date(s.trial_ends_at).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => impersonate(s)}>
                              <Eye className="h-3 w-3 mr-1" /> View as
                            </Button>
                            <Button size="sm" onClick={() => openEdit(s)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No schools.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOCKOUT */}
        <TabsContent value="lockout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-warning" /> Lockout controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>none</strong> = full access · <strong>soft</strong> = warnings only ·{" "}
                <strong>hard</strong> = read-only / blocked.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Current state</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="text-right">Set state</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(schools ?? []).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Badge className={lockColor[s.lockout_state] ?? ""}>
                          {s.lockout_state}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.lockout_started_at
                          ? new Date(s.lockout_started_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={s.lockout_state === "none"}
                          onClick={() => setLockout(s, "none")}
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={s.lockout_state === "soft"}
                          onClick={() => setLockout(s, "soft")}
                        >
                          Soft
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={s.lockout_state === "hard"}
                          onClick={() => setLockout(s, "hard")}
                        >
                          Hard
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit log (last 200 across all schools)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(auditLogs ?? []).map((l) => {
                      const sch = schools?.find((s) => s.id === l.school_id);
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {new Date(l.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">{sch?.name ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{l.action}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {l.entity_type}
                            {l.entity_id ? `:${l.entity_id.slice(0, 8)}` : ""}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {l.actor_user_id?.slice(0, 8) ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs max-w-md truncate font-mono">
                            {l.metadata ? JSON.stringify(l.metadata) : ""}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(auditLogs?.length ?? 0) === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No audit entries.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EDIT DIALOG */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override subscription — {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tier</Label>
              <Select
                value={editForm.subscription_tier}
                onValueChange={(v) => setEditForm((f) => ({ ...f, subscription_tier: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">basic</SelectItem>
                  <SelectItem value="pro">pro</SelectItem>
                  <SelectItem value="enterprise">enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={editForm.subscription_status}
                onValueChange={(v) => setEditForm((f) => ({ ...f, subscription_status: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trialing">trialing</SelectItem>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="past_due">past_due</SelectItem>
                  <SelectItem value="canceled">canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max students</Label>
              <Input
                type="number"
                value={editForm.max_students}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, max_students: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <Label>Trial ends</Label>
              <Input
                type="date"
                value={editForm.trial_ends_at}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, trial_ends_at: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveOverrides}>Save overrides</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdmin;
