import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GraduationCap,
  Calendar,
  Receipt,
  FileText,
  TrendingUp,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useStudentPeriodTotals, useStudentBilling, useStudentEnrollmentYears } from "@/hooks/usePortalData";
import { useStudentAttendanceSummary } from "@/hooks/useAttendance";
import { StudentReportDialog } from "@/components/StudentReportDialog";
import AcademicYearSelector from "@/components/AcademicYearSelector";
import { format } from "date-fns";

interface StudentPortalViewProps {
  student: {
    id: string;
    full_name: string;
    student_id: string;
    photo_url: string | null;
    gender: string | null;
    classes?: { name: string; academic_years?: { year_name: string } | null } | null;
    departments?: { name: string } | null;
  };
}

const periodLabel = (p: string) => {
  const map: Record<string, string> = {
    p1: "Period 1", p2: "Period 2", p3: "Period 3",
    p4: "Period 4", p5: "Period 5", p6: "Period 6",
    exam_s1: "Exam S1", exam_s2: "Exam S2",
  };
  return map[p] ?? p;
};

const StudentPortalView = ({ student }: StudentPortalViewProps) => {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<string>("semester1");
  const [selectedYearId, setSelectedYearId] = useState<string | undefined>(undefined);

  // Years this student has been enrolled in (history table).
  const { data: enrollmentYears } = useStudentEnrollmentYears(student.id);

  // Default the year selector to the current academic year (or the most recent enrollment).
  useEffect(() => {
    if (selectedYearId || !enrollmentYears || enrollmentYears.length === 0) return;
    const current = enrollmentYears.find((e: any) => e.academic_years?.is_current);
    setSelectedYearId((current ?? enrollmentYears[0]).academic_year_id);
  }, [enrollmentYears, selectedYearId]);

  const allowedYearIds = (enrollmentYears ?? []).map((e: any) => e.academic_year_id);
  const selectedEnrollment = (enrollmentYears ?? []).find((e: any) => e.academic_year_id === selectedYearId);

  const { data: totals, isLoading: totalsLoading } = useStudentPeriodTotals(student.id, selectedYearId);
  const { data: attendance, isLoading: attLoading } = useStudentAttendanceSummary(student.id);
  const { data: bills, isLoading: billsLoading } = useStudentBilling(student.id, selectedYearId);

  const currentBill = bills?.find((b: any) => b.academic_years?.is_current) ?? bills?.[0];
  const totalDue = currentBill?.grand_total ?? 0;
  const totalPaid = currentBill?.amount_paid ?? 0;
  const balance = currentBill?.balance ?? 0;

  // Aggregate latest period (best heuristic: highest non-empty period total)
  const bestPeriod = totals && totals.length > 0
    ? [...totals].sort((a: any, b: any) => (b.total_score ?? 0) - (a.total_score ?? 0))[0]
    : null;

  const initials = student.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const openReport = (p: string) => {
    setReportPeriod(p);
    setReportOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-6">
      
      {/* Header Section: Student Greeting & Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-center">
        
        {/* Left: Greeting & Bio */}
        <div className="flex flex-col justify-center px-1">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white/10 p-1 shadow-lg bg-white/5 backdrop-blur-md">
                <AvatarImage src={student.photo_url ?? undefined} className="rounded-full object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-black text-2xl tracking-tighter">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary border-4 border-[#001540] flex items-center justify-center">
                <CheckCircle2 className="size-4 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Student Interface</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Hello, <span className="text-secondary">{student.full_name.split(' ')[0]}</span>
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <Badge className="bg-white/10 text-white/80 border-0 px-3 py-1 backdrop-blur-md text-[9px] font-black uppercase tracking-widest">
                  {student.student_id}
                </Badge>
                <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Academic Standing: Excellent
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Premium Student Identification Card */}
        <div className="relative w-full h-[240px] rounded-[3rem] bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white border border-white/20 overflow-hidden group shadow-2xl transition-all duration-700 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] -ml-24 -mb-24 pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Official Credentials</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <p className="text-xs font-black tracking-tight text-white/90">{selectedEnrollment?.academic_years?.year_name || "Current Session"}</p>
                </div>
              </div>
              <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/20">
                <GraduationCap className="size-7 text-white" />
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Identification Number</p>
              <p className="text-3xl font-black tracking-[0.25em] leading-none">
                {student.student_id.split('').map((char, i) => i > 0 && i % 4 === 0 ? ` ${char}` : char).join('')}
              </p>
            </div>

            <div className="flex justify-between items-end border-t border-white/10 pt-4">
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Institutional Class</p>
                <p className="text-lg font-black tracking-tighter text-secondary leading-none">{selectedEnrollment?.classes?.name ?? student.classes?.name ?? "UNASSIGNED"}</p>
              </div>
              <Badge className="bg-white/20 text-white text-[9px] font-black border-0 px-4 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-md">STATUS: ACTIVE</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interface Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        
        {/* Left Column: Metrics & Grades */}
        <div className="flex flex-col gap-6">
          
          {/* Action Hub & Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
            {/* Quick Actions (Compact Vertical) */}
            <div className="flex flex-col gap-4">
              {[
                { label: "Report Card", icon: FileText, onClick: () => openReport("yearly"), color: "primary" },
                { label: "Attendance", icon: Calendar, color: "secondary" },
                { label: "Financials", icon: Receipt, color: "emerald-400" },
              ].map((action, i) => (
                <button 
                  key={i}
                  onClick={action.onClick}
                  className="group flex items-center gap-4 p-4 rounded-[1.8rem] glass-panel hover:bg-white/10 transition-all duration-300 shadow-none border-white/10"
                >
                  <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className={`size-5 text-white`} />
                  </div>
                  <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-8 rounded-[2.5rem] glass-panel flex flex-col justify-between group min-h-[160px]">
                <div className="w-12 h-12 rounded-[1.2rem] bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                  <Trophy className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Cumulative Mean</p>
                  <h4 className="text-4xl font-black text-white tracking-tighter">
                    {bestPeriod?.total_score?.toFixed(1) ?? "0.0"}%
                  </h4>
                </div>
              </div>
              <div className="p-8 rounded-[2.5rem] glass-panel flex flex-col justify-between group min-h-[160px]">
                <div className="w-12 h-12 rounded-[1.2rem] bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                  <CheckCircle2 className="size-6 text-secondary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Attendance</p>
                  <h4 className="text-4xl font-black text-white tracking-tighter">
                    {attendance?.percentage ?? 0}%
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Records Table */}
          <div className="rounded-[3rem] glass-card p-8 border border-white/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter">Academic Progress</h3>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Detailed performance metrics</p>
              </div>
              <Badge className="bg-primary/20 text-white border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                Full Term 2024
              </Badge>
            </div>
            
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Discipline</th>
                    <th className="pb-2 px-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Phase</th>
                    <th className="pb-2 px-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Standard Score</th>
                    <th className="pb-2 px-6 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Global Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {!totals || totals.length === 0 ? (
                    <tr><td colSpan={4} className="py-20 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest opacity-50">Awaiting academic submission</td></tr>
                  ) : (
                    totals.map((t: any, i: number) => (
                      <tr key={i} className="group">
                        <td className="py-4 px-6 bg-white/5 first:rounded-l-[1.5rem] group-hover:bg-white/10 transition-all duration-300">
                          <p className="font-black text-white text-sm tracking-tight">{t.class_subjects?.subjects?.name ?? "—"}</p>
                        </td>
                        <td className="py-4 px-4 bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                          <Badge className="bg-primary/10 text-primary text-[10px] font-black border-0 uppercase tracking-tighter">
                            {periodLabel(t.period)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 bg-white/5 group-hover:bg-white/10 transition-all duration-300 text-right font-black text-white text-base tracking-tighter">
                          {t.total_score?.toFixed(1) ?? "0.0"}
                        </td>
                        <td className="py-4 px-6 bg-white/5 last:rounded-r-[1.5rem] group-hover:bg-white/10 transition-all duration-300 text-right">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary font-black text-[10px] uppercase">
                            <Trophy className="size-3" />
                            #{t.class_rank ?? '--'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Telemetry */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[3rem] glass-card p-10 flex flex-col shadow-none h-full">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-white tracking-tighter leading-none">Financial <br/>Status</h3>
              <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-500/10 flex items-center justify-center">
                <Receipt className="size-6 text-emerald-400" />
              </div>
            </div>

            {!currentBill ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <AlertCircle className="size-12 text-gray-300 mb-4" />
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">No active bill found</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Grand Total Summary */}
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#001540] to-[#002366] text-white mb-10 shadow-xl border border-white/5 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 relative z-10">Outstanding Balance</p>
                  <h4 className="text-5xl font-black text-secondary tracking-tighter mb-6 relative z-10">
                    ${balance.toLocaleString()}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/5">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Settled</p>
                      <p className="text-sm font-black text-emerald-400">${totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/5">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Total Fee</p>
                      <p className="text-sm font-black text-white">${totalDue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Payment History List */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Log</h5>
                    <Badge className="bg-primary/10 text-primary text-[8px] font-black border-0">REAL-TIME</Badge>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {currentBill.payments && currentBill.payments.length > 0 ? (
                      currentBill.payments.map((p: any) => (
                        <div key={p.id} className="group flex items-center gap-4 p-4 rounded-[1.8rem] glass-panel hover:bg-white/10 hover:border-white/20 transition-all duration-500 shadow-none">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <CheckCircle2 className="size-5 text-emerald-400 group-hover:text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-white truncate tracking-tight">Voucher #{p.receipt_number || "GEN-001"}</p>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">{format(new Date(p.payment_date), "MMMM d, yyyy")}</p>
                          </div>
                          <p className="text-sm font-black text-white tracking-tighter">+${Number(p.amount).toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center py-10 opacity-30">Awaiting initial transaction</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <StudentReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        studentId={student.id}
        period={reportPeriod}
        academicYearId={selectedYearId}
        className={student.classes?.name}
      />
    </div>
  );
};

export default StudentPortalView;
