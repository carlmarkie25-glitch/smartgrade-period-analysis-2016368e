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
                              <th className="text-center p-3 text-sm font-semibold text-foreground">P1</th>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">P2</th>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">P3</th>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">Exam</th>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">Semester Avg</th>
                            </>
                          )}
                          {period === 'semester2' && (
                            <>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">P4</th>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">P5</th>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">P6</th>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">Exam</th>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">Semester Avg</th>
                            </>
                          )}
                          {period === 'yearly' && (
                            <>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">S1 Avg</th>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">S2 Avg</th>
                              <th className="text-center p-3 text-sm font-semibold text-foreground">Year Avg</th>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <th className="text-center p-3 text-sm font-semibold text-foreground">Score</th>
                          <th className="text-center p-3 text-sm font-semibold text-foreground">Percentage</th>
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
                                  <td className="p-3 text-sm text-center text-foreground">
                                    {subject.periods?.p1 ? `${subject.periods.p1.score}/${subject.periods.p1.max} (${subject.periods.p1.percentage}%)` : '-'}
                                  </td>
                                  <td className="p-3 text-sm text-center text-foreground">
                                    {subject.periods?.p2 ? `${subject.periods.p2.score}/${subject.periods.p2.max} (${subject.periods.p2.percentage}%)` : '-'}
                                  </td>
                                  <td className="p-3 text-sm text-center text-foreground">
                                    {subject.periods?.p3 ? `${subject.periods.p3.score}/${subject.periods.p3.max} (${subject.periods.p3.percentage}%)` : '-'}
                                  </td>
                                  <td className="p-3 text-sm text-center text-foreground">
                                    {subject.periods?.exam_s1 ? `${subject.periods.exam_s1.score}/${subject.periods.exam_s1.max} (${subject.periods.exam_s1.percentage}%)` : '-'}
                                  </td>
                                  <td className="p-3 text-sm text-center font-semibold text-foreground">
                                    {subject.semesterAverage}%
                                  </td>
                                </>
                              )}
                              {period === 'semester2' && (
                                <>
                                  <td className="p-3 text-sm text-center text-foreground">
                                    {subject.periods?.p4 ? `${subject.periods.p4.score}/${subject.periods.p4.max} (${subject.periods.p4.percentage}%)` : '-'}
                                  </td>
                                  <td className="p-3 text-sm text-center text-foreground">
                                    {subject.periods?.p5 ? `${subject.periods.p5.score}/${subject.periods.p5.max} (${subject.periods.p5.percentage}%)` : '-'}
                                  </td>
                                  <td className="p-3 text-sm text-center text-foreground">
                                    {subject.periods?.p6 ? `${subject.periods.p6.score}/${subject.periods.p6.max} (${subject.periods.p6.percentage}%)` : '-'}
                                  </td>
                                  <td className="p-3 text-sm text-center text-foreground">
                                    {subject.periods?.exam_s2 ? `${subject.periods.exam_s2.score}/${subject.periods.exam_s2.max} (${subject.periods.exam_s2.percentage}%)` : '-'}
                                  </td>
                                  <td className="p-3 text-sm text-center font-semibold text-foreground">
                                    {subject.semesterAverage}%
                                  </td>
                                </>
                              )}
                              {period === 'yearly' && (
                                <>
                                  <td className="p-3 text-sm text-center text-foreground">
                                    {/* Calculate S1 average */}
                                    {(() => {
                                      const s1Periods = ['p1', 'p2', 'p3', 'exam_s1'];
                                      const s1Scores = s1Periods.map(p => subject.periods?.[p]?.percentage).filter(Boolean);
                                      return s1Scores.length > 0 ? Math.round(s1Scores.reduce((a: number, b: number) => a + b, 0) / s1Scores.length) : '-';
                                    })()}%
                                  </td>
                                  <td className="p-3 text-sm text-center text-foreground">
                                    {/* Calculate S2 average */}
                                    {(() => {
                                      const s2Periods = ['p4', 'p5', 'p6', 'exam_s2'];
                                      const s2Scores = s2Periods.map(p => subject.periods?.[p]?.percentage).filter(Boolean);
                                      return s2Scores.length > 0 ? Math.round(s2Scores.reduce((a: number, b: number) => a + b, 0) / s2Scores.length) : '-';
                                    })()}%
                                  </td>
                                  <td className="p-3 text-sm text-center font-semibold text-foreground">
                                    {subject.semesterAverage}%
                                  </td>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <td className="p-3 text-sm text-center text-foreground">
                                {subject.total}
                              </td>
                              <td className="p-3 text-sm text-center font-semibold text-foreground">
                                {subject.percentage}%
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground mb-1">Overall Average</p>
                <p className="text-3xl font-bold text-primary">{report.overallAverage}%</p>
              </div>
              {report.periodTotal?.class_rank && (
                <div className="p-4 border rounded-lg bg-secondary/5">
                  <p className="text-sm text-muted-foreground mb-1">Class Rank</p>
                  <p className="text-3xl font-bold text-secondary">
                    {report.periodTotal.class_rank}
                    {report.periodTotal.class_rank === 1 ? "st" :
                     report.periodTotal.class_rank === 2 ? "nd" :
                     report.periodTotal.class_rank === 3 ? "rd" : "th"}
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
