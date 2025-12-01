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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StudentReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  period: string;
  className?: string;
}

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
    // In a real app, this would generate a PDF
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

  const periodName = getPeriodName(period);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Report Card</DialogTitle>
          <DialogDescription>
            {periodName} - {className}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : report ? (
          <div className="space-y-6" id="report-content">
            {/* Student Header */}
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30">
              <Avatar className="h-16 w-16">
                <AvatarImage src={report.student.photo_url || ""} />
                <AvatarFallback>
                  {report.student.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{report.student.full_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Student ID: {report.student.student_id}
                </p>
                <p className="text-sm text-muted-foreground">
                  Class: {report.student.classes?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Academic Year: {report.student.classes?.academic_years?.year_name}
                </p>
              </div>
            </div>

            {/* Subjects Table */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-3">Academic Performance</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold text-foreground">Subject</th>
                      {report.isSemesterReport ? (
                        <>
                          {period === 'semester1' && (
                            <>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P1</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P2</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P3</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">Exam</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">S1 Avg</th>
                            </>
                          )}
                          {period === 'semester2' && (
                            <>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P4</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P5</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P6</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">Exam</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">S2 Avg</th>
                            </>
                          )}
                          {period === 'yearly' && (
                            <>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P1</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P2</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P3</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">Ex S1</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">S1 Avg</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P4</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P5</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">P6</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">Ex S2</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">S2 Avg</th>
                              <th className="text-center p-2 text-xs font-semibold text-foreground">Year Avg</th>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <th className="text-center p-3 text-sm font-semibold text-foreground">Score</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {report.subjects.map((subject: any, index: number) => {
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-3 text-sm text-foreground font-medium">
                            {subject.name}
                          </td>
                          {report.isSemesterReport ? (
                            <>
                              {period === 'semester1' && (
                                <>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p1?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p2?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p3?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.exam_s1?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center font-semibold text-foreground">
                                    {subject.semesterAverage !== null ? subject.semesterAverage.toFixed(1) : '-'}
                                  </td>
                                </>
                              )}
                              {period === 'semester2' && (
                                <>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p4?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p5?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p6?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.exam_s2?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center font-semibold text-foreground">
                                    {subject.semesterAverage !== null ? subject.semesterAverage.toFixed(1) : '-'}
                                  </td>
                                </>
                              )}
                              {period === 'yearly' && (
                                <>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p1?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p2?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p3?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.exam_s1?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center font-semibold text-foreground">
                                    {(() => {
                                      const s1Periods = ['p1', 'p2', 'p3', 'exam_s1'];
                                      const s1Scores = s1Periods.map(p => subject.periods?.[p]?.score).filter(Boolean);
                                      return s1Scores.length === 4 ? (Math.floor((s1Scores.reduce((a: number, b: number) => a + b, 0) / s1Scores.length) * 10) / 10).toFixed(1) : '-';
                                    })()}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p4?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p5?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.p6?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center text-foreground">
                                    {subject.periods?.exam_s2?.score || '-'}
                                  </td>
                                  <td className="p-2 text-xs text-center font-semibold text-foreground">
                                    {(() => {
                                      const s2Periods = ['p4', 'p5', 'p6', 'exam_s2'];
                                      const s2Scores = s2Periods.map(p => subject.periods?.[p]?.score).filter(Boolean);
                                      return s2Scores.length === 4 ? (Math.floor((s2Scores.reduce((a: number, b: number) => a + b, 0) / s2Scores.length) * 10) / 10).toFixed(1) : '-';
                                    })()}
                                  </td>
                                  <td className="p-2 text-xs text-center font-semibold text-foreground">
                                    {subject.semesterAverage !== null ? subject.semesterAverage.toFixed(1) : '-'}
                                  </td>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <td className="p-3 text-sm text-center text-foreground">
                                {subject.total}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                    {/* Average Row */}
                    {report.isSemesterReport ? (
                      <>
                        <tr className="border-t-2 bg-muted/50">
                          <td className="p-3 text-sm font-bold text-foreground">Average</td>
                          {period === 'semester1' && (
                            <>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p1?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p2?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p3?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.exam_s1?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-bold text-foreground">
                                {report.overallAverage !== null ? (Math.floor(report.overallAverage * 10) / 10).toFixed(1) : '-'}
                              </td>
                            </>
                          )}
                          {period === 'semester2' && (
                            <>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p4?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p5?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p6?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.exam_s2?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-bold text-foreground">
                                {report.overallAverage !== null ? (Math.floor(report.overallAverage * 10) / 10).toFixed(1) : '-'}
                              </td>
                            </>
                          )}
                          {period === 'yearly' && (
                            <>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p1?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p2?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p3?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.exam_s1?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const s1Averages = report.subjects.map((s: any) => {
                                    const s1Periods = ['p1', 'p2', 'p3', 'exam_s1'];
                                    const s1Scores = s1Periods.map(p => s.periods?.[p]?.score).filter(Boolean);
                                    return s1Scores.length === 4 ? s1Scores.reduce((a: number, b: number) => a + b, 0) / s1Scores.length : null;
                                  }).filter(Boolean);
                                  return s1Averages.length > 0 ? (Math.floor((s1Averages.reduce((a: number, b: number) => a + b, 0) / s1Averages.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p4?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p5?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.p6?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const scores = report.subjects.map((s: any) => s.periods?.exam_s2?.score).filter(Boolean);
                                  return scores.length > 0 ? (Math.floor((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-foreground">
                                {(() => {
                                  const s2Averages = report.subjects.map((s: any) => {
                                    const s2Periods = ['p4', 'p5', 'p6', 'exam_s2'];
                                    const s2Scores = s2Periods.map(p => s.periods?.[p]?.score).filter(Boolean);
                                    return s2Scores.length === 4 ? s2Scores.reduce((a: number, b: number) => a + b, 0) / s2Scores.length : null;
                                  }).filter(Boolean);
                                  return s2Averages.length > 0 ? (Math.floor((s2Averages.reduce((a: number, b: number) => a + b, 0) / s2Averages.length) * 10) / 10).toFixed(1) : '-';
                                })()}
                              </td>
                              <td className="p-2 text-xs text-center font-bold text-foreground">
                                {report.overallAverage !== null ? (Math.floor(report.overallAverage * 10) / 10).toFixed(1) : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                        {/* Rank Row */}
                        <tr className="border-t bg-muted/30">
                          <td className="p-3 text-sm font-bold text-foreground">Rank</td>
                          {period === 'semester1' && (
                            <>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p1')?.class_rank && report.periodCounts?.p1 
                                  ? `${report.periodTotals.get('p1').class_rank}/${report.periodCounts.p1}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p2')?.class_rank && report.periodCounts?.p2 
                                  ? `${report.periodTotals.get('p2').class_rank}/${report.periodCounts.p2}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p3')?.class_rank && report.periodCounts?.p3 
                                  ? `${report.periodTotals.get('p3').class_rank}/${report.periodCounts.p3}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('exam_s1')?.class_rank && report.periodCounts?.exam_s1 
                                  ? `${report.periodTotals.get('exam_s1').class_rank}/${report.periodCounts.exam_s1}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-bold text-muted-foreground">
                                {report.yearlyTotal?.class_rank && report.periodCounts?.exam_s1 
                                  ? `${report.yearlyTotal.class_rank}/${report.periodCounts.exam_s1}` 
                                  : '-'}
                              </td>
                            </>
                          )}
                          {period === 'semester2' && (
                            <>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p4')?.class_rank && report.periodCounts?.p4 
                                  ? `${report.periodTotals.get('p4').class_rank}/${report.periodCounts.p4}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p5')?.class_rank && report.periodCounts?.p5 
                                  ? `${report.periodTotals.get('p5').class_rank}/${report.periodCounts.p5}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p6')?.class_rank && report.periodCounts?.p6 
                                  ? `${report.periodTotals.get('p6').class_rank}/${report.periodCounts.p6}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('exam_s2')?.class_rank && report.periodCounts?.exam_s2 
                                  ? `${report.periodTotals.get('exam_s2').class_rank}/${report.periodCounts.exam_s2}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-bold text-muted-foreground">
                                {report.yearlyTotal?.class_rank && report.periodCounts?.exam_s2 
                                  ? `${report.yearlyTotal.class_rank}/${report.periodCounts.exam_s2}` 
                                  : '-'}
                              </td>
                            </>
                          )}
                          {period === 'yearly' && (
                            <>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p1')?.class_rank && report.periodCounts?.p1 
                                  ? `${report.periodTotals.get('p1').class_rank}/${report.periodCounts.p1}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p2')?.class_rank && report.periodCounts?.p2 
                                  ? `${report.periodTotals.get('p2').class_rank}/${report.periodCounts.p2}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p3')?.class_rank && report.periodCounts?.p3 
                                  ? `${report.periodTotals.get('p3').class_rank}/${report.periodCounts.p3}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('exam_s1')?.class_rank && report.periodCounts?.exam_s1 
                                  ? `${report.periodTotals.get('exam_s1').class_rank}/${report.periodCounts.exam_s1}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                -
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p4')?.class_rank && report.periodCounts?.p4 
                                  ? `${report.periodTotals.get('p4').class_rank}/${report.periodCounts.p4}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p5')?.class_rank && report.periodCounts?.p5 
                                  ? `${report.periodTotals.get('p5').class_rank}/${report.periodCounts.p5}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('p6')?.class_rank && report.periodCounts?.p6 
                                  ? `${report.periodTotals.get('p6').class_rank}/${report.periodCounts.p6}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                {report.periodTotals?.get('exam_s2')?.class_rank && report.periodCounts?.exam_s2 
                                  ? `${report.periodTotals.get('exam_s2').class_rank}/${report.periodCounts.exam_s2}` 
                                  : '-'}
                              </td>
                              <td className="p-2 text-xs text-center font-semibold text-muted-foreground">
                                -
                              </td>
                              <td className="p-2 text-xs text-center font-bold text-muted-foreground">
                                {report.yearlyTotal?.class_rank && report.periodCounts?.exam_s2 
                                  ? `${report.yearlyTotal.class_rank}/${report.periodCounts.exam_s2}` 
                                  : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      </>
                    ) : (
                      /* Individual Period Report - Add Rank Row */
                      <>
                        <tr className="border-t-2 bg-muted/50">
                          <td className="p-3 text-sm font-bold text-foreground">Average</td>
                          <td className="p-3 text-sm text-center font-semibold text-foreground">
                            {report.overallAverage !== null ? (Math.floor(report.overallAverage * 10) / 10).toFixed(1) : '-'}
                          </td>
                        </tr>
                        <tr className="border-t bg-muted/30">
                          <td className="p-3 text-sm font-bold text-foreground">Rank</td>
                          <td className="p-3 text-sm text-center font-bold text-muted-foreground">
                            {(() => {
                              const periodTotal = report.periodTotals?.get(period as any);
                              const count = report.periodCounts?.[period];
                              return periodTotal?.class_rank && count
                                ? `${periodTotal.class_rank}/${count}` 
                                : '-';
                            })()}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground mb-1">Overall Average</p>
                <p className="text-3xl font-bold text-primary">
                  {report.overallAverage !== null ? report.overallAverage.toFixed(1) : 'N/A'}
                </p>
              </div>
              {report.yearlyTotal?.class_rank && (
                <div className="p-4 border rounded-lg bg-secondary/5">
                  <p className="text-sm text-muted-foreground mb-1">Overall Class Rank</p>
                  <p className="text-3xl font-bold text-secondary">
                    {(() => {
                      const rank = report.yearlyTotal.class_rank;
                      return rank ? `${rank}${rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th"}` : '-';
                    })()}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t print:hidden">
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
