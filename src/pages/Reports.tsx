import Navbar from "@/components/Navbar";
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
  const [selectedPeriod, setSelectedPeriod] = useState<string>("p3");
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
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
              <SelectItem value="p1">Period 1 Report</SelectItem>
              <SelectItem value="p2">Period 2 Report</SelectItem>
              <SelectItem value="p3">Period 3 Report</SelectItem>
              <SelectItem value="p4">Period 4 Report</SelectItem>
              <SelectItem value="p5">Period 5 Report</SelectItem>
              <SelectItem value="p6">Period 6 Report</SelectItem>
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
                Student Report Cards - {classes?.find(c => c.id === selectedClass)?.name} - 
                Period {selectedPeriod.replace('p', '')}
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
      </main>
    </div>
  );
};

export default Reports;
