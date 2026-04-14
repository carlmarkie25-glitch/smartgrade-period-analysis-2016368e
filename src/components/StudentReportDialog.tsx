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

// Helper to check if a score is incomplete (null, undefined, or below 60)
const isIncompleteScore = (score: number | null | undefined): boolean => {
  return score === null || score === undefined || score < 60;
};

// Helper to display score or "I" for incomplete, "--" for no grades
const displayScore = (score: number | null | undefined, noGrades?: boolean): string => {
  if (noGrades) return '--';
  if (isIncompleteScore(score)) return 'I';
  return String(score);
};

// Get letter grade from average
const getLetterGrade = (avg: number | null): { letter: string; color: string } => {
  if (avg === null) return { letter: '--', color: 'bg-gray-400' };
  if (avg >= 90) return { letter: 'A+', color: 'bg-[hsl(145,70%,42%)]' };
  if (avg >= 80) return { letter: 'A', color: 'bg-[hsl(145,70%,42%)]' };
  if (avg >= 75) return { letter: 'B+', color: 'bg-[hsl(170,50%,40%)]' };
  if (avg >= 70) return { letter: 'B', color: 'bg-[hsl(170,50%,40%)]' };
  if (avg >= 65) return { letter: 'C+', color: 'bg-[hsl(45,80%,50%)]' };
  if (avg >= 60) return { letter: 'C', color: 'bg-[hsl(45,80%,50%)]' };
  return { letter: 'F', color: 'bg-red-500' };
};

// Helper to compute period average from report subjects
const computePeriodAvg = (subjects: any[], periodKey: string, hasIncomplete: boolean): string => {
  if (hasIncomplete) return '--';
  const scores = subjects.map((s: any) => s.periods?.[periodKey]?.score).filter((s: any) => s !== null && s !== undefined && s >= 60);
  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
};

// Helper to compute semester average from multiple periods
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  const getPeriodName = (period: string) => {
    switch(period) {
      case "yearly": return "Final Year Report";
      case "semester1": return "Semester 1 Report";
      case "semester2": return "Semester 2 Report";
      case "exam_s1": return "Semester 1 Exam Report";
      case "exam_s2": return "Semester 2 Exam Report";
      default: return `Period ${period.replace("p", "")} Report`;
    }
  };

  const getDepartmentLabel = (report: any) => {
    // Try to derive from class name or department
    return report.student?.departments?.name || className || "DEPARTMENT";
  };

  const periodName = getPeriodName(period);
  const grade = report ? getLetterGrade(report.overallAverage) : { letter: '--', color: 'bg-gray-400' };

  // Determine columns based on period
  const getColumns = () => {
    if (period === 'semester1') return ['p1', 'p2', 'p3', 'exam_s1'];
    if (period === 'semester2') return ['p4', 'p5', 'p6', 'exam_s2'];
    if (period === 'yearly') return ['p1', 'p2', 'p3', 'exam_s1', 'p4', 'p5', 'p6', 'exam_s2'];
    return [period]; // single period
  };

  const getColumnHeaders = () => {
    if (period === 'semester1') return ['P1', 'P2', 'P3', 'S.AVC', 'P4', 'P5', 'P6', 'S.AVC', 'Y.AVG'];
    if (period === 'semester2') return ['P4', 'P5', 'P6', 'S.AVC', 'Y.AVG'];
    if (period === 'yearly') return ['P1', 'P2', 'P3', 'S.AVC', 'P4', 'P5', 'P6', 'S.AVC', 'Y.AVG'];
    return ['Score'];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none" style={{ background: '#f5f5f0' }}>
        <DialogHeader className="sr-only">
          <DialogTitle>Student Report Card</DialogTitle>
          <DialogDescription>{periodName}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : report ? (
          <div id="report-content" className="font-sans">
            {/* ===== DARK HEADER ===== */}
            <div className="relative px-6 py-4" style={{ background: 'linear-gradient(135deg, #1a2744 0%, #243554 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-wider uppercase">REPORT</h1>
                  <p className="text-xs font-semibold text-teal-300 uppercase tracking-widest mt-0.5">
                    {getDepartmentLabel(report)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Student Grade</span>
                  <div className={`${grade.color} text-white text-3xl font-black w-14 h-14 flex items-center justify-center rounded-md shadow-lg`}>
                    {grade.letter}
                  </div>
                </div>
              </div>
            </div>

            {/* ===== STUDENT INFO ===== */}
            <div className="px-6 py-3 border-b-2" style={{ borderColor: '#1a2744' }}>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase whitespace-nowrap">Name of Student</span>
                  <span className="text-sm font-bold text-gray-900 uppercase border-b border-gray-400 flex-1 pb-0.5 text-center">
                    {report.student.full_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase whitespace-nowrap">Academic Year</span>
                  <span className="text-sm font-bold text-gray-900 border-b border-gray-400 flex-1 pb-0.5 text-center">
                    {report.student.classes?.academic_years?.year_name || '--'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase whitespace-nowrap">Grade Level</span>
                  <span className="text-sm font-bold text-gray-900 uppercase border-b border-gray-400 flex-1 pb-0.5 text-center">
                    {report.student.classes?.name || '--'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase whitespace-nowrap">Report Type</span>
                  <span className="text-sm font-bold text-gray-900 border-b border-gray-400 flex-1 pb-0.5 text-center">
                    {periodName}
                  </span>
                </div>
              </div>
            </div>

            {/* Incomplete Notice */}
            {report.hasIncomplete && (
              <div className="mx-6 mt-3 p-2 rounded text-xs font-medium" style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' }}>
                ⚠️ This student has incomplete grades (marked as "I"). Averages and rankings cannot be calculated until all grades are complete.
              </div>
            )}

            {/* ===== GRADES TABLE ===== */}
            <div className="px-6 py-3">
              <div className="overflow-hidden rounded border" style={{ borderColor: '#1a2744' }}>
                <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a2744' }}>
                      <th className="text-left px-3 py-2 text-white font-bold text-[11px] uppercase tracking-wide border-r border-gray-600">Subject</th>
                      {report.isSemesterReport ? (
                        period === 'yearly' ? (
                          <>
                            <th className="text-center px-1.5 py-2 text-white font-bold text-[10px] border-r border-gray-600">P1</th>
                            <th className="text-center px-1.5 py-2 text-white font-bold text-[10px] border-r border-gray-600">P2</th>
                            <th className="text-center px-1.5 py-2 text-white font-bold text-[10px] border-r border-gray-600">P3</th>
                            <th className="text-center px-1.5 py-2 text-yellow-300 font-bold text-[10px] border-r border-gray-600">S.AVC</th>
                            <th className="text-center px-1.5 py-2 text-white font-bold text-[10px] border-r border-gray-600">P4</th>
                            <th className="text-center px-1.5 py-2 text-white font-bold text-[10px] border-r border-gray-600">P5</th>
                            <th className="text-center px-1.5 py-2 text-white font-bold text-[10px] border-r border-gray-600">P6</th>
                            <th className="text-center px-1.5 py-2 text-yellow-300 font-bold text-[10px] border-r border-gray-600">S.AVC</th>
                            <th className="text-center px-1.5 py-2 text-green-300 font-bold text-[10px]">Y.AVG</th>
                          </>
                        ) : period === 'semester1' ? (
                          <>
                            <th className="text-center px-2 py-2 text-white font-bold text-[10px] border-r border-gray-600">P1</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[10px] border-r border-gray-600">P2</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[10px] border-r border-gray-600">P3</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[10px] border-r border-gray-600">Exam</th>
                            <th className="text-center px-2 py-2 text-yellow-300 font-bold text-[10px]">S.AVC</th>
                          </>
                        ) : (
                          <>
                            <th className="text-center px-2 py-2 text-white font-bold text-[10px] border-r border-gray-600">P4</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[10px] border-r border-gray-600">P5</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[10px] border-r border-gray-600">P6</th>
                            <th className="text-center px-2 py-2 text-white font-bold text-[10px] border-r border-gray-600">Exam</th>
                            <th className="text-center px-2 py-2 text-yellow-300 font-bold text-[10px]">S.AVC</th>
                          </>
                        )
                      ) : (
                        <th className="text-center px-3 py-2 text-white font-bold text-[11px]">Score</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {report.subjects.map((subject: any, index: number) => {
                      const isEven = index % 2 === 0;
                      const rowBg = isEven ? '#ffffff' : '#f0f4f8';
                      return (
                        <tr key={index} style={{ background: rowBg, borderBottom: '1px solid #d1d5db' }}>
                          <td className="px-3 py-1.5 font-semibold text-gray-800 text-[11px] uppercase border-r" style={{ borderColor: '#d1d5db' }}>
                            {subject.name}
                          </td>
                          {report.isSemesterReport ? (
                            period === 'yearly' ? (
                              <>
                                {['p1','p2','p3'].map(p => (
                                  <td key={p} className="text-center px-1.5 py-1.5 font-semibold text-gray-800 text-[11px] border-r" style={{ borderColor: '#d1d5db' }}>
                                    {displayScore(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades)}
                                  </td>
                                ))}
                                {/* S1 AVG */}
                                <td className="text-center px-1.5 py-1.5 font-bold text-[11px] border-r" style={{ borderColor: '#d1d5db', color: '#1a2744' }}>
                                  {(() => {
                                    const s1Periods = ['p1', 'p2', 'p3', 'exam_s1'];
                                    const hasS1Incomplete = s1Periods.some(p => subject.periods?.[p]?.isIncomplete);
                                    if (hasS1Incomplete) return '--';
                                    const s1Scores = s1Periods.map((p: string) => subject.periods?.[p]?.score).filter((s: any) => s !== null && s !== undefined);
                                    return s1Scores.length === 4 ? (Math.floor((s1Scores.reduce((a: number, b: number) => a + b, 0) / s1Scores.length) * 10) / 10).toFixed(1) : '-';
                                  })()}
                                </td>
                                {['p4','p5','p6'].map(p => (
                                  <td key={p} className="text-center px-1.5 py-1.5 font-semibold text-gray-800 text-[11px] border-r" style={{ borderColor: '#d1d5db' }}>
                                    {displayScore(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades)}
                                  </td>
                                ))}
                                {/* S2 AVG */}
                                <td className="text-center px-1.5 py-1.5 font-bold text-[11px] border-r" style={{ borderColor: '#d1d5db', color: '#1a2744' }}>
                                  {(() => {
                                    const s2Periods = ['p4', 'p5', 'p6', 'exam_s2'];
                                    const hasS2Incomplete = s2Periods.some(p => subject.periods?.[p]?.isIncomplete);
                                    if (hasS2Incomplete) return '--';
                                    const s2Scores = s2Periods.map((p: string) => subject.periods?.[p]?.score).filter((s: any) => s !== null && s !== undefined);
                                    return s2Scores.length === 4 ? (Math.floor((s2Scores.reduce((a: number, b: number) => a + b, 0) / s2Scores.length) * 10) / 10).toFixed(1) : '-';
                                  })()}
                                </td>
                                {/* Y.AVG */}
                                <td className="text-center px-1.5 py-1.5 font-black text-[11px]" style={{ color: '#16a34a' }}>
                                  {subject.hasIncomplete ? '--' : (subject.semesterAverage !== null ? subject.semesterAverage.toFixed(1) : '-')}
                                </td>
                              </>
                            ) : period === 'semester1' ? (
                              <>
                                {['p1','p2','p3','exam_s1'].map(p => (
                                  <td key={p} className={`text-center px-2 py-1.5 font-semibold text-[11px] border-r ${subject.periods?.[p]?.noGrades ? 'text-gray-400' : subject.periods?.[p]?.isIncomplete ? 'text-orange-500 font-bold' : 'text-gray-800'}`} style={{ borderColor: '#d1d5db' }}>
                                    {displayScore(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades)}
                                  </td>
                                ))}
                                <td className="text-center px-2 py-1.5 font-bold text-[11px]" style={{ color: '#1a2744' }}>
                                  {subject.hasIncomplete ? '--' : (subject.semesterAverage !== null ? subject.semesterAverage.toFixed(1) : '-')}
                                </td>
                              </>
                            ) : (
                              <>
                                {['p4','p5','p6','exam_s2'].map(p => (
                                  <td key={p} className={`text-center px-2 py-1.5 font-semibold text-[11px] border-r ${subject.periods?.[p]?.noGrades ? 'text-gray-400' : subject.periods?.[p]?.isIncomplete ? 'text-orange-500 font-bold' : 'text-gray-800'}`} style={{ borderColor: '#d1d5db' }}>
                                    {displayScore(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades)}
                                  </td>
                                ))}
                                <td className="text-center px-2 py-1.5 font-bold text-[11px]" style={{ color: '#1a2744' }}>
                                  {subject.hasIncomplete ? '--' : (subject.semesterAverage !== null ? subject.semesterAverage.toFixed(1) : '-')}
                                </td>
                              </>
                            )
                          ) : (
                            <td className={`text-center px-3 py-1.5 font-bold text-[11px] ${subject.noGrades ? 'text-gray-400' : subject.hasIncomplete ? 'text-orange-500' : 'text-gray-800'}`}>
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

            {/* ===== TEACHER COMMENT ===== */}
            <div className="px-6 py-2">
              <div className="rounded border p-3 space-y-1.5" style={{ borderColor: '#d1d5db', background: '#fafafa' }}>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-gray-600 uppercase whitespace-nowrap w-28">Teacher Comment:</span>
                  <span className="text-[11px] text-gray-500 border-b border-gray-300 flex-1 min-h-[16px]"></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-gray-600 uppercase whitespace-nowrap w-28">Excels In:</span>
                  <span className="text-[11px] text-gray-500 border-b border-gray-300 flex-1 min-h-[16px]"></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-gray-600 uppercase whitespace-nowrap w-28">Can Improve In:</span>
                  <span className="text-[11px] text-gray-500 border-b border-gray-300 flex-1 min-h-[16px]"></span>
                </div>
              </div>
            </div>

            {/* ===== SEMESTER AVERAGE / GENERAL AVERAGE BAR ===== */}
            <div className="mx-6 mt-1 rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2" style={{ background: '#1a2744' }}>
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Semester Average</span>
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">General Average</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3" style={{ background: '#f0f4f8' }}>
                <div className="space-y-1">
                  {report.isSemesterReport && (period === 'yearly' || period === 'semester1') && (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-gray-700">SEM1</span>
                      <span className="text-sm font-bold text-gray-900">
                        {computeSemAvg(report.subjects, ['p1','p2','p3','exam_s1'], report.hasIncomplete)}%
                      </span>
                    </div>
                  )}
                  {report.isSemesterReport && (period === 'yearly' || period === 'semester2') && (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-gray-700">SEM2</span>
                      <span className="text-sm font-bold text-gray-900">
                        {computeSemAvg(report.subjects, ['p4','p5','p6','exam_s2'], report.hasIncomplete)}%
                      </span>
                    </div>
                  )}
                  {!report.isSemesterReport && (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-gray-700">Period</span>
                      <span className="text-sm font-bold text-gray-900">
                        {report.hasIncomplete ? '--' : (report.overallAverage !== null ? report.overallAverage.toFixed(1) + '%' : '-')}
                      </span>
                    </div>
                  )}
                  {/* Rank */}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Rank</span>
                    <span className="text-xs font-bold text-gray-800">
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
                {/* Big green percentage */}
                <div className="text-right">
                  <span className="text-5xl font-black" style={{ color: '#16a34a' }}>
                    {report.hasIncomplete ? '--' : (report.overallAverage !== null ? `${report.overallAverage.toFixed(1)}%` : '-')}
                  </span>
                </div>
              </div>
            </div>

            {/* ===== SPONSOR SIGNATURE ===== */}
            <div className="px-6 py-3 flex justify-end">
              <div className="text-right">
                <div className="border-t border-gray-400 w-40 mb-0.5"></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Class Sponsor</span>
              </div>
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
