import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentReportDialog } from "@/components/StudentReportDialog";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("p1");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: students, isLoading: studentsLoading } = useStudents(selectedClass);
  const { toast } = useToast();

  const handleViewReport = (studentId: string) => {
    setSelectedStudent(studentId);
    setDialogOpen(true);
  };

  const handleGenerateAll = () => {
    toast({
      title: "Generating Reports",
      description: `Generating ${students?.length || 0} report cards...`,
    });
    // In a real app, this would trigger batch PDF generation
  };

  const getPeriodDisplayName = (period: string) => {
    switch(period) {
      case "yearly": return "Final Year";
      case "semester1": return "Semester 1";
      case "semester2": return "Semester 2";
      case "exam_s1": return "Semester 1 Exam";
      case "exam_s2": return "Semester 2 Exam";
      case "p1": return "Period 1";
      case "p2": return "Period 2";
      case "p3": return "Period 3";
      case "p4": return "Period 4";
      case "p5": return "Period 5";
      case "p6": return "Period 6";
      default: return period;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-muted-foreground">Generate and view student report cards</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classesLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : classes?.length === 0 ? (
                <SelectItem value="none" disabled>No classes available</SelectItem>
              ) : (
                classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Semester 1</div>
              <SelectItem value="p1">Period 1 Report</SelectItem>
              <SelectItem value="p2">Period 2 Report</SelectItem>
              <SelectItem value="p3">Period 3 Report</SelectItem>
              <SelectItem value="exam_s1">Exam Report</SelectItem>
              <SelectItem value="semester1">Semester 1 Report</SelectItem>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Semester 2</div>
              <SelectItem value="p4">Period 4 Report</SelectItem>
              <SelectItem value="p5">Period 5 Report</SelectItem>
              <SelectItem value="p6">Period 6 Report</SelectItem>
              <SelectItem value="exam_s2">Exam Report</SelectItem>
              <SelectItem value="semester2">Semester 2 Report</SelectItem>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Final</div>
              <SelectItem value="yearly">Final Yearly Report</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            className="gap-2" 
            disabled={!selectedClass || !students || students.length === 0}
            onClick={handleGenerateAll}
          >
            <FileText className="h-4 w-4" />
            Generate All Reports
          </Button>
        </div>

        {!selectedClass ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                Please select a class to view student reports
              </p>
            </CardContent>
          </Card>
        ) : studentsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                Student Report Cards - {classes?.find(c => c.id === selectedClass)?.name} - {getPeriodDisplayName(selectedPeriod)}
              </CardTitle>
              <CardDescription>View and download individual student reports</CardDescription>
            </CardHeader>
            <CardContent>
              {students && students.length > 0 ? (
                <div className="space-y-4">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={student.photo_url || ""} />
                          <AvatarFallback>
                            {student.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground">{student.student_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="text-xl font-bold text-primary">Active</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => handleViewReport(student.id)}
                          >
                            <Eye className="h-4 w-4" />
                            View Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No students found in this class
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <StudentReportDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          studentId={selectedStudent}
          period={selectedPeriod}
          className={classes?.find(c => c.id === selectedClass)?.name || ""}
        />
      </div>
    </MainLayout>
  );
};

export default Reports;
