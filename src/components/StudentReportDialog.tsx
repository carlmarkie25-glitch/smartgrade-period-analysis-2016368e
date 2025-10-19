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

  const periodName = period === "yearly" 
    ? "Final Year Report" 
    : `Period ${period.replace("p", "")} Report`;

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
                      <th className="text-center p-3 text-sm font-semibold text-foreground">Score</th>
                      <th className="text-center p-3 text-sm font-semibold text-foreground">Max</th>
                      <th className="text-center p-3 text-sm font-semibold text-foreground">Percentage</th>
                      <th className="text-center p-3 text-sm font-semibold text-foreground">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.subjects.map((subject, index) => {
                      const grade = subject.percentage >= 90 ? "A" :
                                   subject.percentage >= 80 ? "B" :
                                   subject.percentage >= 70 ? "C" :
                                   subject.percentage >= 60 ? "D" :
                                   subject.percentage >= 50 ? "E" : "F";
                      
                      const gradeColor = subject.percentage >= 50 ? "text-success" : "text-destructive";

                      return (
                        <tr key={index} className="border-t">
                          <td className="p-3 text-sm text-foreground font-medium">
                            {subject.name}
                          </td>
                          <td className="p-3 text-sm text-center text-foreground">
                            {subject.total}
                          </td>
                          <td className="p-3 text-sm text-center text-muted-foreground">
                            {subject.max}
                          </td>
                          <td className="p-3 text-sm text-center font-semibold text-foreground">
                            {subject.percentage}%
                          </td>
                          <td className={`p-3 text-sm text-center font-bold ${gradeColor}`}>
                            {grade}
                          </td>
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
