import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, FileWarning, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { useClasses, useClassSubjects } from "@/hooks/useClasses";
import {
  useAttendanceSession,
  useAttendanceRecords,
  useSaveAttendance,
  type AttendanceStatus,
} from "@/hooks/useAttendance";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { LockedFeatureBanner } from "@/components/LockedFeatureBanner";

interface RosterStudent {
  id: string;
  full_name: string;
  student_id: string;
}

const STATUS_META: Record<AttendanceStatus, { label: string; cls: string; icon: any }> = {
  present: { label: "Present", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  absent:  { label: "Absent",  cls: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30", icon: XCircle },
  excused: { label: "Excused", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30", icon: FileWarning },
};

export default function Attendance() {
  const { school } = useSchool();
  const { toast } = useToast();
  const { has, hasAccess } = useFeatureAccess();

  const [classId, setClassId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("none");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  const { data: classes = [] } = useClasses("teaching");
  const { data: classSubjects = [] } = useClassSubjects(classId || undefined);

  const effectiveSubjectId = subjectId === "none" ? null : subjectId;
  const { data: session } = useAttendanceSession(classId || undefined, date, effectiveSubjectId);
  const { data: existingRecords = [] } = useAttendanceRecords(session?.id);
  const save = useSaveAttendance();

  // Load roster when class changes
  useEffect(() => {
    if (!classId) { setRoster([]); return; }
    setLoadingRoster(true);
    supabase
      .from("students")
      .select("id, full_name, student_id")
      .eq("class_id", classId)
      .eq("is_active", true)
      .order("full_name")
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Failed to load roster", description: error.message, variant: "destructive" });
          setRoster([]);
        } else {
          setRoster((data ?? []) as RosterStudent[]);
        }
        setLoadingRoster(false);
      });
  }, [classId, toast]);

  // Hydrate statuses: existing records win, otherwise default to present
  useEffect(() => {
    const next: Record<string, AttendanceStatus> = {};
    roster.forEach((s) => { next[s.id] = "present"; });
    existingRecords.forEach((r) => { next[r.student_id] = r.status; });
    setStatuses(next);
  }, [roster, existingRecords]);

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, excused: 0 };
    Object.values(statuses).forEach((s) => { c[s] += 1; });
    return c;
  }, [statuses]);

  const setAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    roster.forEach((s) => { next[s.id] = status; });
    setStatuses(next);
  };

  const handleSave = async () => {
    if (!classId || roster.length === 0) return;
    try {
      await save.mutateAsync({
        classId,
        date,
        classSubjectId: effectiveSubjectId,
        schoolId: school?.id ?? null,
        records: roster.map((s) => ({ student_id: s.id, status: statuses[s.id] ?? "present" })),
      });
      toast({ title: "Attendance saved", description: `${roster.length} students • ${format(new Date(date), "MMM d, yyyy")}` });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  if (!hasAccess) {
    return (
      <AppShell activeTab="attendance">
        <LockedFeatureBanner feature="Attendance" requiredPlan="premium" />
      </AppShell>
    );
  }

  if (!has("attendance")) {
    return (
      <AppShell activeTab="attendance">
        <LockedFeatureBanner feature="Attendance" requiredPlan="premium" />
      </AppShell>
    );
  }

  return (
    <AppShell activeTab="attendance">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Mark students Present, Absent, or Excused. You can edit attendance for any past date.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select roster</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setSubjectId("none"); }}>
                <SelectTrigger><SelectValue placeholder="Choose a class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                <SelectTrigger><SelectValue placeholder="Daily homeroom" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Daily homeroom (no subject)</SelectItem>
                  {classSubjects.map((cs: any) => (
                    <SelectItem key={cs.id} value={cs.id}>
                      {cs.subjects?.name ?? "Subject"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={format(new Date(), "yyyy-MM-dd")} />
            </div>
          </CardContent>
        </Card>

        {classId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Roll call — {format(new Date(date), "EEEE, MMM d, yyyy")}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className={STATUS_META.present.cls}>{counts.present} Present</Badge>
                  <Badge variant="outline" className={STATUS_META.absent.cls}>{counts.absent} Absent</Badge>
                  <Badge variant="outline" className={STATUS_META.excused.cls}>{counts.excused} Excused</Badge>
                  {session && <Badge variant="secondary">Editing existing session</Badge>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setAll("present")}>Mark all Present</Button>
                <Button variant="outline" size="sm" onClick={() => setAll("absent")}>Mark all Absent</Button>
                <Button onClick={handleSave} disabled={save.isPending || roster.length === 0}>
                  {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save attendance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRoster ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading roster…
                </div>
              ) : roster.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No active students in this class.</div>
              ) : (
                <div className="space-y-2">
                  {roster.map((s) => {
                    const current = statuses[s.id] ?? "present";
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                      >
                        <div>
                          <div className="font-medium">{s.full_name}</div>
                          <div className="text-xs text-muted-foreground">ID: {s.student_id}</div>
                        </div>
                        <div className="flex gap-1">
                          {(Object.keys(STATUS_META) as AttendanceStatus[]).map((st) => {
                            const meta = STATUS_META[st];
                            const Icon = meta.icon;
                            const active = current === st;
                            return (
                              <Button
                                key={st}
                                size="sm"
                                variant={active ? "default" : "outline"}
                                className={active ? meta.cls + " border" : ""}
                                onClick={() => setStatuses((p) => ({ ...p, [s.id]: st }))}
                              >
                                <Icon className="h-4 w-4 mr-1" />
                                {meta.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
