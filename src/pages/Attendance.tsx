import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, FileWarning, Save, UserCheck } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col gap-6 pb-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] glass-panel flex items-center justify-center border border-white/20 p-1.5 shadow-none">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">
                <UserCheck className="size-8" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1.5">Operational Control</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Attendance
              </h1>
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="glass-card p-8">
          <h3 className="text-sm font-black text-white/70 uppercase tracking-widest mb-6">Roster Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Class</Label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setSubjectId("none"); }}>
                <SelectTrigger className="glass-panel border-none h-12 text-xs font-bold text-white">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/90 backdrop-blur-xl border-white/10 text-white">
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Subject (optional)</Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                <SelectTrigger className="glass-panel border-none h-12 text-xs font-bold text-white">
                  <SelectValue placeholder="Daily homeroom" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/90 backdrop-blur-xl border-white/10 text-white">
                  <SelectItem value="none">Daily homeroom</SelectItem>
                  {classSubjects.map((cs: any) => (
                    <SelectItem key={cs.id} value={cs.id}>
                      {cs.subjects?.name ?? "Subject"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Date</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                max={format(new Date(), "yyyy-MM-dd")} 
                className="glass-panel border-none h-12 text-xs font-bold text-white placeholder:text-white/20"
              />
            </div>
          </div>
        </div>

        {classId && (
          <div className="glass-card overflow-hidden">
            <div className="p-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter">
                  Roll Call — <span className="text-secondary">{format(new Date(date), "EEEE, MMM d, yyyy")}</span>
                </h3>
                <div className="flex gap-2 mt-4">
                  <div className="px-3 py-1 glass-pill text-[9px] font-black text-emerald-400 uppercase tracking-widest">{counts.present} Present</div>
                  <div className="px-3 py-1 glass-pill text-[9px] font-black text-rose-400 uppercase tracking-widest">{counts.absent} Absent</div>
                  <div className="px-3 py-1 glass-pill text-[9px] font-black text-amber-400 uppercase tracking-widest">{counts.excused} Excused</div>
                  {session && <div className="px-3 py-1 glass-pill text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10">Editing Session</div>}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button variant="ghost" className="h-10 px-4 rounded-xl glass-panel border-none text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white" onClick={() => setAll("present")}>All Present</Button>
                <Button variant="ghost" className="h-10 px-4 rounded-xl glass-panel border-none text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white" onClick={() => setAll("absent")}>All Absent</Button>
                <Button 
                  className="h-10 px-6 rounded-xl bg-secondary text-white text-[9px] font-black uppercase tracking-widest hover:bg-secondary/90 transition-all shadow-lg"
                  onClick={handleSave} 
                  disabled={save.isPending || roster.length === 0}
                >
                  {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Commit Roster
                </Button>
              </div>
            </div>

            <div className="p-8">
              {loadingRoster ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Assembling Student Roster…</p>
                </div>
              ) : roster.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">No students detected in class hierarchy</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {roster.map((s) => {
                    const current = statuses[s.id] ?? "present";
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-6 p-4 glass-panel !rounded-[1.8rem] bg-white/5 hover:border-white/20 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-[1.2rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <span className="text-[10px] font-black text-white/40 uppercase group-hover:text-white transition-colors">
                                {s.full_name.split(' ').map(n => n[0]).join('')}
                              </span>
                           </div>
                           <div>
                             <div className="text-sm font-black text-white tracking-tight">{s.full_name}</div>
                             <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">ID: {s.student_id}</div>
                           </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {(Object.keys(STATUS_META) as AttendanceStatus[]).map((st) => {
                            const meta = STATUS_META[st];
                            const Icon = meta.icon;
                            const active = current === st;
                            return (
                              <Button
                                key={st}
                                size="sm"
                                variant="ghost"
                                className={cn(
                                  "h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                  active 
                                    ? st === 'present' ? "bg-emerald-500 text-white shadow-lg" : 
                                      st === 'absent' ? "bg-rose-500 text-white shadow-lg" : 
                                      "bg-amber-500 text-white shadow-lg"
                                    : "glass-panel border-none text-white/40 hover:text-white"
                                )}
                                onClick={() => setStatuses((p) => ({ ...p, [s.id]: st }))}
                              >
                                <Icon className="h-3.5 w-3.5 mr-2" />
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
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
