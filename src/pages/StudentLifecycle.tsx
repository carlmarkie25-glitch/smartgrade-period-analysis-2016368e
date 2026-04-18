import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive, RotateCcw, AlertTriangle, Download, Loader2, GraduationCap, ArrowRightLeft, LogOut, Ban } from "lucide-react";
import { useArchivedStudents, useDepartedStudents, useReinstateStudent } from "@/hooks/useStudentLifecycle";
import { format } from "date-fns";
import { useState } from "react";
import { generateTransferPack, downloadBlob } from "@/lib/transferPack";
import { useToast } from "@/hooks/use-toast";
import { useSchool } from "@/contexts/SchoolContext";

const statusConfig: Record<string, { color: string; icon: typeof GraduationCap; label: string }> = {
  graduated: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: GraduationCap, label: "Graduated" },
  transferred: { color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: ArrowRightLeft, label: "Transferred" },
  withdrawn: { color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: LogOut, label: "Withdrawn" },
  expelled: { color: "bg-red-500/10 text-red-600 border-red-500/30", icon: Ban, label: "Expelled" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = statusConfig[status];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.color} gap-1`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
};

const StudentLifecycle = () => {
  const departed = useDepartedStudents();
  const archived = useArchivedStudents();
  const reinstate = useReinstateStudent();
  const { school } = useSchool();
  const { toast } = useToast();
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (s: any) => {
    setExportingId(s.id);
    try {
      const blob = await generateTransferPack(s.id, {
        name: school?.name,
        address: (school as any)?.address,
        phone: (school as any)?.phone,
        email: (school as any)?.email,
      });
      const safeName = (s.full_name ?? "student").replace(/[^a-z0-9]+/gi, "_");
      downloadBlob(blob, `transfer-pack-${safeName}-${s.student_id ?? s.id}.pdf`);
      toast({ title: "Transfer Pack downloaded" });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExportingId(null);
    }
  };

  const today = new Date();
  const daysLeft = (d: string | null) =>
    d ? Math.ceil((new Date(d).getTime() - today.getTime()) / 86400000) : null;

  return (
    <AppShell activeTab="dashboard">
      <div className="py-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Student Lifecycle & Retention</h1>
          <p className="text-sm text-muted-foreground">
            Manage departed students. Records auto-archive after 3 years (PRD §8).
          </p>
        </div>

        <Tabs defaultValue="departed">
          <TabsList>
            <TabsTrigger value="departed">Departed</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value="departed">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Departed students</CardTitle>
                <CardDescription>
                  Graduated, transferred, withdrawn, or expelled. Excluded from billable seats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {departed.isLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !departed.data?.length ? (
                  <p className="text-sm text-muted-foreground">No departed students yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Departed</TableHead>
                        <TableHead>Retention expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departed.data.map((s: any) => {
                        const left = daysLeft(s.retention_expires_at);
                        const urgent = left !== null && left <= 90;
                        return (
                          <TableRow key={s.id}>
                            <TableCell>
                              <div className="font-medium">{s.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {s.student_id} · {s.classes?.name ?? "—"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={s.status} />
                            </TableCell>
                            <TableCell className="text-sm">
                              {s.departure_date ? format(new Date(s.departure_date), "MMM d, yyyy") : "—"}
                              {s.departure_reason && (
                                <div className="text-xs text-muted-foreground line-clamp-1">{s.departure_reason}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {s.retention_expires_at ? (
                                <div className={urgent ? "text-amber-600 font-medium flex items-center gap-1" : ""}>
                                  {urgent && <AlertTriangle className="h-3 w-3" />}
                                  {format(new Date(s.retention_expires_at), "MMM d, yyyy")}
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({left}d)
                                  </span>
                                </div>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport(s)}
                                disabled={exportingId === s.id}
                              >
                                {exportingId === s.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4 mr-1" />
                                )}
                                Transfer Pack
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => reinstate.mutate(s.id)}
                                disabled={reinstate.isPending}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reinstate
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archived">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Archived students
                </CardTitle>
                <CardDescription>
                  Anonymized after 3 years. Only aggregate summaries are retained.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {archived.isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : !archived.data?.length ? (
                  <p className="text-sm text-muted-foreground">No archived records.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Anon. ID</TableHead>
                        <TableHead>Final status</TableHead>
                        <TableHead>Archived</TableHead>
                        <TableHead>Grades</TableHead>
                        <TableHead>Total paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archived.data.map((s: any) => {
                        const sum = s.archive_summary ?? {};
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-xs">{sum.student_id ?? "—"}</TableCell>
                            <TableCell>{sum.final_status ? <StatusBadge status={sum.final_status} /> : <Badge variant="outline">—</Badge>}</TableCell>
                            <TableCell className="text-sm">
                              {s.archived_at ? format(new Date(s.archived_at), "MMM d, yyyy") : "—"}
                            </TableCell>
                            <TableCell className="text-sm">{sum.grade_count ?? 0}</TableCell>
                            <TableCell className="text-sm">
                              ${Number(sum.total_paid ?? 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default StudentLifecycle;
