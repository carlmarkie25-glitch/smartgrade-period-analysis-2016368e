import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { useStudentReport } from "@/hooks/useStudentReport";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  period: string;
  className?: string;
}

const isIncompleteScore = (score: number | null | undefined): boolean => {
  return score === null || score === undefined || score < 60;
};

const displayScore = (score: number | null | undefined, noGrades?: boolean): string => {
  if (noGrades) return '--';
  if (isIncompleteScore(score)) return 'I';
  return String(score);
};

const computeSemAvg = (subjects: any[], periods: string[], hasIncomplete: boolean): string => {
  if (hasIncomplete) return '--';
  const avgs = subjects.map((s: any) => {
    const scores = periods.map(p => s.periods?.[p]?.score).filter((sc: any) => sc !== null && sc !== undefined && sc >= 60);
    return scores.length === periods.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;
  }).filter(Boolean);
  return avgs.length > 0 ? (Math.floor(((avgs as number[]).reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10).toFixed(1) : '-';
};

export const StudentReportDialog = ({
  open,
  onOpenChange,
  studentId,
  period,
  className,
}: StudentReportDialogProps) => {
  const { data: report, isLoading } = useStudentReport(studentId, period);

  const handlePrint = () => window.print();
  const handleDownload = () => window.print();

  const getPeriodName = (period: string) => {
    switch (period) {
      case "yearly": return "1 & 2";
      case "semester1": return "1";
      case "semester2": return "2";
      case "exam_s1": return "Exam S1";
      case "exam_s2": return "Exam S2";
      default: return `P${period.replace("p", "")}`;
    }
  };

  const getDepartmentLabel = (report: any) => {
    return report.student?.departments?.name || className || "DEPARTMENT";
  };

  const semesterLabel = getPeriodName(period);

  // Compute subject yearly avg for yearly report
  const computeSubjectYearlyAvg = (subject: any): string => {
    if (subject.hasIncomplete) return '--';
    const s1Periods = ['p1', 'p2', 'p3'];
    const s2Periods = ['p4', 'p5', 'p6'];
    const s1Scores = s1Periods.map(p => subject.periods?.[p]?.score).filter((s: any) => s !== null && s !== undefined && s >= 60);
    const s2Scores = s2Periods.map(p => subject.periods?.[p]?.score).filter((s: any) => s !== null && s !== undefined && s >= 60);
    if (s1Scores.length !== 3 || s2Scores.length !== 3) return '-';
    const s1Avg = s1Scores.reduce((a: number, b: number) => a + b, 0) / 3;
    const s2Avg = s2Scores.reduce((a: number, b: number) => a + b, 0) / 3;
    return (Math.floor(((s1Avg + s2Avg) / 2) * 10) / 10).toFixed(0);
  };

  const computeSubjectSemAvg = (subject: any, periods: string[]): string => {
    const hasInc = periods.some(p => subject.periods?.[p]?.isIncomplete || subject.periods?.[p]?.noGrades);
    if (hasInc) return '--';
    const scores = periods.map(p => subject.periods?.[p]?.score).filter((s: any) => s !== null && s !== undefined);
    if (scores.length !== periods.length) return '-';
    return (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none" style={{ background: '#ffffff' }}>
        <DialogHeader className="sr-only">
          <DialogTitle>Student Report Card</DialogTitle>
          <DialogDescription>Academic Report Card</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : report ? (
          <div id="report-content" style={{ fontFamily: "'Times New Roman', Times, serif" }}>

            {/* ===== HEADER WITH LOGO SPACE ===== */}
            <div className="px-6 pt-5 pb-3">
              <div className="flex items-start justify-between">
                {/* Left: Logo placeholder + School info */}
                <div className="flex items-start gap-4">
                  {/* Logo placeholder */}
                  <div
                    className="flex items-center justify-center rounded-full border-4 flex-shrink-0"
                    style={{
                      width: 80,
                      height: 80,
                      borderColor: '#1a2744',
                      background: '#e8edf3',
                    }}
                  >
                    <span className="text-[9px] font-bold text-center leading-tight" style={{ color: '#1a2744' }}>
                      SCHOOL<br />LOGO
                    </span>
                  </div>
                  <div className="pt-1">
                    <h1 className="text-xl font-extrabold tracking-wide" style={{ color: '#1a2744' }}>
                      SCHOOL NAME HERE
                    </h1>
                    <p className="text-[11px] text-gray-600">Address Line, City, Country</p>
                    <p className="text-[11px] text-gray-600">Contact: (000) 000-0000000</p>
                  </div>
                </div>
                {/* Right: Report type & semester */}
                <div className="text-right pt-1 space-y-1">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[11px] font-bold text-gray-600 uppercase">Report Type:</span>
                    <span
                      className="text-[11px] font-bold px-3 py-0.5 border"
                      style={{ borderColor: '#1a2744', color: '#1a2744' }}
                    >
                      {getDepartmentLabel(report).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[11px] font-bold text-gray-600 uppercase">Semester:</span>
                    <span
                      className="text-[11px] font-bold px-3 py-0.5 border"
                      style={{ borderColor: '#1a2744', color: '#1a2744' }}
                    >
                      {semesterLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mt-2">
                <h2 className="text-lg font-extrabold tracking-wider uppercase" style={{ color: '#1a2744' }}>
                  Academic Report Card
                </h2>
                <p className="text-[11px] text-gray-500">
                  {report.student.classes?.academic_years?.year_name || '--'} SCHOOL YEAR
                </p>
              </div>
            </div>

            {/* ===== STUDENT INFO BAR ===== */}
            <div className="mx-6 mb-3 border-t border-b py-2 space-y-1" style={{ borderColor: '#1a2744' }}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[11px] font-bold text-gray-600 uppercase whitespace-nowrap" style={{ background: '#e0e5ec', padding: '2px 8px' }}>
                    Name of Student
                  </span>
                  <span className="text-sm font-bold text-gray-900 border-b flex-1 text-center pb-0.5" style={{ borderColor: '#999' }}>
                    {report.student.full_name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[11px] font-bold text-gray-600 uppercase whitespace-nowrap" style={{ background: '#e0e5ec', padding: '2px 8px' }}>
                    Grade Level
                  </span>
                  <span className="text-sm font-bold text-gray-900 border-b flex-1 text-center pb-0.5" style={{ borderColor: '#999' }}>
                    {report.student.classes?.name || '--'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase whitespace-nowrap" style={{ background: '#e0e5ec', padding: '2px 8px' }}>
                    Student ID
                  </span>
                  <span className="text-sm font-bold text-gray-900 border-b text-center pb-0.5 w-28" style={{ borderColor: '#999' }}>
                    {report.student.student_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Incomplete Notice */}
            {report.hasIncomplete && (
              <div className="mx-6 mb-2 p-2 rounded text-xs font-medium" style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' }}>
                ⚠️ This student has incomplete grades (marked as "I"). Averages and rankings cannot be calculated until all grades are complete.
              </div>
            )}

            {/* ===== GRADES TABLE ===== */}
            <div className="px-6 pb-3">
              <div className="overflow-hidden border-2" style={{ borderColor: '#1a2744' }}>
                <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#1a2744' }}>
                      <th className="text-left px-3 py-2 text-white font-bold text-[12px] uppercase tracking-wide border-r border-gray-500" style={{ width: '120px' }}>
                        Subject
                      </th>
                      {report.isSemesterReport ? (
                        period === 'yearly' ? (
                          <>
                            <th className="text-center px-1 py-2 text-white font-bold text-[11px] border-r border-gray-500">P1</th>
                            <th className="text-center px-1 py-2 text-white font-bold text-[11px] border-r border-gray-500">P2</th>
                            <th className="text-center px-1 py-2 text-white font-bold text-[11px] border-r border-gray-500">P3</th>
                            <th className="text-center px-1 py-2 font-bold text-[11px] border-r border-gray-500" style={{ color: '#fde68a' }}>S.AVG</th>
                            <th className="text-center px-1 py-2 text-white font-bold text-[11px] border-r border-gray-500">P4</th>
                            <th className="text-center px-1 py-2 text-white font-bold text-[11px] border-r border-gray-500">P5</th>
                            <th className="text-center px-1 py-2 text-white font-bold text-[11px] border-r border-gray-500">P6</th>
                            <th className="text-center px-1 py-2 font-bold text-[11px] border-r border-gray-500" style={{ color: '#fde68a' }}>S.AVG</th>
                            <th className="text-center px-1 py-2 font-bold text-[12px]" style={{ color: '#86efac', background: '#1a2744' }}>Y.AVG</th>
                          </>
                        ) : period === 'semester1' ? (
                          <>
                            <th className="text-center px-2 py-2 text-white font-bold text-[11px] border-r border-gray-500">P1</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[11px] border-r border-gray-500">P2</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[11px] border-r border-gray-500">P3</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[11px] border-r border-gray-500">Exam</th>
                            <th className="text-center px-2 py-2 font-bold text-[11px]" style={{ color: '#fde68a' }}>S.AVG</th>
                          </>
                        ) : (
                          <>
                            <th className="text-center px-2 py-2 text-white font-bold text-[11px] border-r border-gray-500">P4</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[11px] border-r border-gray-500">P5</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[11px] border-r border-gray-500">P6</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[11px] border-r border-gray-500">Exam</th>
                            <th className="text-center px-2 py-2 font-bold text-[11px]" style={{ color: '#fde68a' }}>S.AVG</th>
                          </>
                        )
                      ) : (
                        <th className="text-center px-3 py-2 text-white font-bold text-[12px]">Score</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {report.subjects.map((subject: any, index: number) => {
                      const isEven = index % 2 === 0;
                      const rowBg = isEven ? '#ffffff' : '#f5f7fa';
                      return (
                        <tr key={index} style={{ background: rowBg, borderBottom: '1px solid #cbd5e1' }}>
                          <td className="px-3 py-1.5 font-bold text-[12px] uppercase border-r" style={{ borderColor: '#cbd5e1', color: '#1a2744' }}>
                            {subject.name}
                          </td>
                          {report.isSemesterReport ? (
                            period === 'yearly' ? (
                              <>
                                {['p1', 'p2', 'p3'].map(p => (
                                  <td key={p} className="text-center px-1 py-1.5 font-semibold text-[12px] border-r" style={{ borderColor: '#cbd5e1', color: '#374151' }}>
                                    {displayScore(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades)}
                                  </td>
                                ))}
                                {/* S1 AVG */}
                                <td className="text-center px-1 py-1.5 font-bold text-[12px] border-r" style={{ borderColor: '#cbd5e1', color: '#1a2744' }}>
                                  {computeSubjectSemAvg(subject, ['p1', 'p2', 'p3'])}
                                </td>
                                {['p4', 'p5', 'p6'].map(p => (
                                  <td key={p} className="text-center px-1 py-1.5 font-semibold text-[12px] border-r" style={{ borderColor: '#cbd5e1', color: '#374151' }}>
                                    {displayScore(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades)}
                                  </td>
                                ))}
                                {/* S2 AVG */}
                                <td className="text-center px-1 py-1.5 font-bold text-[12px] border-r" style={{ borderColor: '#cbd5e1', color: '#1a2744' }}>
                                  {computeSubjectSemAvg(subject, ['p4', 'p5', 'p6'])}
                                </td>
                                {/* Y.AVG - green bg */}
                                <td className="text-center px-1 py-1.5 font-black text-[12px]" style={{ background: '#dcfce7', color: '#166534' }}>
                                  {computeSubjectYearlyAvg(subject)}
                                </td>
                              </>
                            ) : period === 'semester1' ? (
                              <>
                                {['p1', 'p2', 'p3', 'exam_s1'].map(p => (
                                  <td key={p} className={`text-center px-2 py-1.5 font-semibold text-[12px] border-r`} style={{ borderColor: '#cbd5e1', color: subject.periods?.[p]?.noGrades ? '#9ca3af' : subject.periods?.[p]?.isIncomplete ? '#ea580c' : '#374151' }}>
                                    {displayScore(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades)}
                                  </td>
                                ))}
                                <td className="text-center px-2 py-1.5 font-bold text-[12px]" style={{ color: '#1a2744' }}>
                                  {subject.hasIncomplete ? '--' : (subject.semesterAverage !== null ? subject.semesterAverage.toFixed(1) : '-')}
                                </td>
                              </>
                            ) : (
                              <>
                                {['p4', 'p5', 'p6', 'exam_s2'].map(p => (
                                  <td key={p} className={`text-center px-2 py-1.5 font-semibold text-[12px] border-r`} style={{ borderColor: '#cbd5e1', color: subject.periods?.[p]?.noGrades ? '#9ca3af' : subject.periods?.[p]?.isIncomplete ? '#ea580c' : '#374151' }}>
                                    {displayScore(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades)}
                                  </td>
                                ))}
                                <td className="text-center px-2 py-1.5 font-bold text-[12px]" style={{ color: '#1a2744' }}>
                                  {subject.hasIncomplete ? '--' : (subject.semesterAverage !== null ? subject.semesterAverage.toFixed(1) : '-')}
                                </td>
                              </>
                            )
                          ) : (
                            <td className={`text-center px-3 py-1.5 font-bold text-[12px]`} style={{ color: subject.noGrades ? '#9ca3af' : subject.hasIncomplete ? '#ea580c' : '#374151' }}>
                              {subject.noGrades ? '--' : subject.hasIncomplete ? 'I' : subject.total}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== TEACHER COMMENT SECTION ===== */}
            <div className="px-6 pb-3">
              <div className="space-y-2 border-t pt-3" style={{ borderColor: '#cbd5e1' }}>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-bold uppercase whitespace-nowrap" style={{ color: '#1a2744' }}>Teacher Comment:</span>
                  <div className="flex-1 border-b min-h-[20px]" style={{ borderColor: '#9ca3af', background: '#f0f0f0' }}></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-bold uppercase whitespace-nowrap" style={{ color: '#1a2744' }}>Excell In:</span>
                  <div className="flex-1 border-b min-h-[20px]" style={{ borderColor: '#9ca3af', background: '#d1d5db' }}></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-bold uppercase whitespace-nowrap" style={{ color: '#1a2744' }}>Can Improve In:</span>
                  <div className="flex-1 border-b min-h-[20px]" style={{ borderColor: '#9ca3af', background: '#d1d5db' }}></div>
                </div>
              </div>
            </div>

            {/* ===== SEMESTER AVERAGE / GENERAL AVERAGE BAR ===== */}
            <div className="mx-6 mt-1 overflow-hidden border-2" style={{ borderColor: '#1a2744' }}>
              {/* Header bar */}
              <div className="flex items-center justify-between px-4 py-2" style={{ background: '#1a2744' }}>
                <span className="text-[13px] font-extrabold text-white uppercase tracking-wider">Semester Average</span>
                <span className="text-[13px] font-extrabold text-white uppercase tracking-wider">General Average</span>
              </div>
              {/* Content */}
              <div className="flex items-center justify-between px-6 py-4">
                {/* Left: Semester averages */}
                <div className="space-y-2">
                  {report.isSemesterReport && (period === 'yearly' || period === 'semester1') && (
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] font-bold" style={{ color: '#1a2744' }}>SEM1</span>
                      <span className="text-base font-bold" style={{ color: '#374151' }}>
                        {computeSemAvg(report.subjects, ['p1', 'p2', 'p3'], report.hasIncomplete)}%
                      </span>
                    </div>
                  )}
                  {report.isSemesterReport && (period === 'yearly' || period === 'semester2') && (
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] font-bold" style={{ color: '#1a2744' }}>SEM2</span>
                      <span className="text-base font-bold" style={{ color: '#374151' }}>
                        {computeSemAvg(report.subjects, ['p4', 'p5', 'p6'], report.hasIncomplete)}%
                      </span>
                    </div>
                  )}
                  {!report.isSemesterReport && (
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] font-bold" style={{ color: '#1a2744' }}>Period</span>
                      <span className="text-base font-bold" style={{ color: '#374151' }}>
                        {report.hasIncomplete ? '--' : (report.overallAverage !== null ? report.overallAverage.toFixed(1) + '%' : '-')}
                      </span>
                    </div>
                  )}
                  {/* Rank */}
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Rank</span>
                    <span className="text-sm font-bold" style={{ color: '#1a2744' }}>
                      {report.hasIncomplete ? '--' : (() => {
                        if (report.isSemesterReport) {
                          const rank = report.yearlyTotal?.class_rank;
                          const lastPeriod = period === 'semester1' ? 'exam_s1' : 'exam_s2';
                          const count = report.periodCounts?.[lastPeriod];
                          return rank && count ? `${rank}/${count}` : '-';
                        }
                        const pt = report.periodTotals?.get(period as any);
                        const count = report.periodCounts?.[period];
                        return pt?.class_rank && count ? `${pt.class_rank}/${count}` : '-';
                      })()}
                    </span>
                  </div>
                </div>
                {/* Right: Big green percentage */}
                <div className="text-right">
                  <span className="font-black" style={{ fontSize: '56px', color: '#16a34a', lineHeight: 1 }}>
                    {report.hasIncomplete ? '--' : (report.overallAverage !== null ? `${report.overallAverage.toFixed(1)}%` : '-')}
                  </span>
                </div>
              </div>
            </div>

            {/* ===== APPROVED BY / SPONSOR SECTION ===== */}
            <div className="px-6 py-4 flex justify-center">
              <div className="text-center">
                <p className="text-[11px] font-bold uppercase text-gray-600 mb-1">Approved By:</p>
                <div className="border-t-2 w-48 mx-auto mb-1" style={{ borderColor: '#374151' }}></div>
                <p className="text-[11px] font-bold uppercase" style={{ color: '#1a2744' }}>Class Sponsor</p>
                <p className="text-[10px] text-gray-500 uppercase">Official School Seal</p>
              </div>
            </div>

            {/* ===== FOOTER ===== */}
            <div className="text-center py-2 border-t" style={{ borderColor: '#1a2744', background: '#f5f7fa' }}>
              <span className="text-[10px] text-gray-500">
                Generated by SmartGrade School Management System
              </span>
            </div>

            {/* ===== ACTION BUTTONS ===== */}
            <div className="flex gap-2 px-6 py-4 border-t print:hidden" style={{ background: '#eee' }}>
              <Button onClick={handlePrint} className="gap-2 flex-1">
                <Printer className="h-4 w-4" />
                Print Report
              </Button>
              <Button onClick={handleDownload} variant="outline" className="gap-2 flex-1">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No report data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
