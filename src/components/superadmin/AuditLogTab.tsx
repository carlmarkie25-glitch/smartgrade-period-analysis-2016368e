import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type School = { id: string; name: string };

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

const ROW_LIMIT = 1000;

export const AuditLogTab = ({ schools }: { schools: School[] }) => {
  const { toast } = useToast();
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["super-admin-audit-filtered", schoolFilter, actionFilter, entityFilter, from, to],
    queryFn: async () => {
      let q = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(ROW_LIMIT);

      if (schoolFilter !== "all") q = q.eq("school_id", schoolFilter);
      if (entityFilter !== "all") q = q.eq("entity_type", entityFilter);
      if (actionFilter.trim()) q = q.ilike("action", `%${actionFilter.trim()}%`);
      if (from) q = q.gte("created_at", new Date(from).toISOString());
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        q = q.lte("created_at", end.toISOString());
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
  });

  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    (logs ?? []).forEach((l) => set.add(l.entity_type));
    return Array.from(set).sort();
  }, [logs]);

  const clearFilters = () => {
    setSchoolFilter("all");
    setActionFilter("");
    setEntityFilter("all");
    setFrom("");
    setTo("");
  };

  const exportCsv = () => {
    if (!logs?.length) {
      toast({ title: "Nothing to export", description: "No rows match filters." });
      return;
    }
    const schoolMap = new Map(schools.map((s) => [s.id, s.name]));
    const headers = ["created_at", "school", "school_id", "action", "entity_type", "entity_id", "actor_user_id", "metadata"];
    const rows = logs.map((l) => [
      new Date(l.created_at).toISOString(),
      schoolMap.get(l.school_id ?? "") ?? "",
      l.school_id ?? "",
      l.action,
      l.entity_type,
      l.entity_id ?? "",
      l.actor_user_id ?? "",
      l.metadata ? JSON.stringify(l.metadata).split('"').join('""') : "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).split('"').join('""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${logs.length} rows downloaded` });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>
          Audit log{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({logs?.length ?? 0}{logs?.length === ROW_LIMIT ? "+" : ""} entries)
          </span>
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
          <Button size="sm" onClick={exportCsv}>
            <Download className="h-3 w-3 mr-1" /> Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs">School</Label>
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schools</SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Entity type</Label>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {entityTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Action contains</Label>
            <Input
              placeholder="e.g. lockout"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        {/* Table */}
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : (logs?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No audit entries match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                logs!.map((l) => {
                  const sch = schools.find((s) => s.id === l.school_id);
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(l.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">{sch?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
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
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
