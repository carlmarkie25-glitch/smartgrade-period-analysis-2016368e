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
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={student.photo_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{student.full_name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <GraduationCap className="h-3 w-3 mr-1" />
                {student.classes?.name ?? "No class"}
              </Badge>
              {student.departments?.name && (
                <Badge variant="outline" className="text-xs">{student.departments.name}</Badge>
              )}
              {student.classes?.academic_years?.year_name && (
                <Badge variant="outline" className="text-xs">{student.classes.academic_years.year_name}</Badge>
              )}
              <span className="text-xs text-muted-foreground">ID: {student.student_id}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== SUMMARY STATS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Best subject rank */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Top Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : bestPeriod ? (
              <>
                <div className="text-2xl font-bold">
                  {bestPeriod.total_score?.toFixed(1) ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(bestPeriod as any).class_subjects?.subjects?.name ?? "—"} · Rank #{bestPeriod.class_rank ?? "—"}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No grades yet</p>
            )}
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-500" /> Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{attendance?.percentage ?? 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {attendance?.present ?? 0} present · {attendance?.absent ?? 0} absent ·{" "}
                  {attendance?.excused ?? 0} excused
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Fees */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-500" /> Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${balance > 0 ? "text-destructive" : "text-emerald-600"}`}>
                  {balance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Paid {totalPaid.toLocaleString()} of {totalDue.toLocaleString()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== GRADES BY PERIOD ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Grades by Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalsLoading ? (
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !totals || totals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No grades recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-2 font-medium text-muted-foreground">Subject</th>
                    <th className="py-2 px-2 font-medium text-muted-foreground">Period</th>
                    <th className="py-2 px-2 font-medium text-muted-foreground text-right">Score</th>
                    <th className="py-2 px-2 font-medium text-muted-foreground text-right">Class Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.map((t: any, i: number) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-2">{t.class_subjects?.subjects?.name ?? "—"}</td>
                      <td className="py-2 px-2 text-muted-foreground">{periodLabel(t.period)}</td>
                      <td className="py-2 px-2 text-right font-medium">{t.total_score?.toFixed(1) ?? "—"}</td>
                      <td className="py-2 px-2 text-right">
                        {t.class_rank ? (
                          <Badge variant="secondary">#{t.class_rank}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== FEES & RECEIPTS ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Fees & Payment Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !currentBill ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No bill issued yet.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{Number(currentBill.grand_total).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-lg font-bold text-emerald-600">{Number(currentBill.amount_paid).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className={`text-lg font-bold ${Number(currentBill.balance) > 0 ? "text-destructive" : "text-emerald-600"}`}>
                    {Number(currentBill.balance).toLocaleString()}
                  </p>
                </div>
              </div>

              {currentBill.payments && currentBill.payments.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent Payments</h4>
                  <div className="space-y-1">
                    {currentBill.payments.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-background border text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <div>
                            <p className="font-medium">Receipt {p.receipt_number ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(p.payment_date), "PP")} · {p.payment_method}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold">{Number(p.amount).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No payments recorded.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== REPORT CARD DOWNLOAD ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Report Card
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            View and download the official academic report card.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => openReport("semester1")}>
              Semester 1
            </Button>
            <Button size="sm" variant="outline" onClick={() => openReport("semester2")}>
              Semester 2
            </Button>
            <Button size="sm" onClick={() => openReport("yearly")}>
              Full Year
            </Button>
          </div>
        </CardContent>
      </Card>

      <StudentReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        studentId={student.id}
        period={reportPeriod}
        className={student.classes?.name}
      />
    </div>
  );
};

export default StudentPortalView;
