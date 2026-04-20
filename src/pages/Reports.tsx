import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef } from "react";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentReportDialog } from "@/components/StudentReportDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const Reports = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("p1");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Batch download state
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [chosenMode, setChosenMode] = useState<"color" | "grey">("color");
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const zipRef = useRef<any>(null);
  const cancelRef = useRef(false);

  const { data: classes, isLoading: classesLoading } = useClasses("sponsor");
  const { data: students, isLoading: studentsLoading } = useStudents(selectedClass);
  const { toast } = useToast();

  const handleViewReport = (studentId: string) => {
    setSelectedStudent(studentId);
    setDialogOpen(true);
  };

  const handleDownloadAllClick = () => {
    if (!students || students.length === 0) return;
    setChosenMode("color");
    setModeDialogOpen(true);
  };

  const startBatch = async () => {
    setModeDialogOpen(false);
    if (!students || students.length === 0) return;
    const { default: JSZip } = await import("jszip");
    zipRef.current = new JSZip();
    cancelRef.current = false;
    setBatchProgress({ done: 0, total: students.length });
    setBatchIndex(0);
    setBatchOpen(true);
    toast({
      title: "Downloading reports",
      description: `Generating ${students.length} report${students.length > 1 ? "s" : ""}...`,
    });
  };

  // Called by the hidden dialog once the report is rendered & data loaded
  const handleReportReady = async (studentName: string) => {
    if (cancelRef.current) {
      finishBatch();
      return;
    }
    try {
      const el = document.getElementById("report-content");
      if (!el) return;

      // Replace form controls with text spans, mirroring the single-report flow
      const controls = Array.from(
        el.querySelectorAll("textarea, input, select")
      ) as (HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement)[];
      const placeholders: { control: HTMLElement; replacement: HTMLElement }[] = [];
      controls.forEach((ctrl) => {
        const span = document.createElement("div");
        let val = "";
        if (ctrl instanceof HTMLSelectElement) {
          val = ctrl.options[ctrl.selectedIndex]?.text || "";
        } else {
          val = (ctrl as HTMLInputElement | HTMLTextAreaElement).value || "";
        }
        span.textContent = val.trim() ? val : "\u00A0";
        span.style.cssText = ctrl.style.cssText;
        span.style.whiteSpace = "pre-wrap";
        span.style.display = "block";
        ctrl.parentNode?.insertBefore(span, ctrl);
        ctrl.style.display = "none";
        placeholders.push({ control: ctrl, replacement: span });
      });

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const renderWidth = el.scrollWidth;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: renderWidth,
        width: renderWidth,
        scrollX: 0,
        scrollY: -window.scrollY,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      const x = (pageW - imgW) / 2;
      pdf.addImage(imgData, "PNG", x, 0, imgW, imgH);
      const pdfBlob = pdf.output("blob");

      const safeName = studentName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
      zipRef.current.file(`Report_${safeName}_${selectedPeriod}.pdf`, pdfBlob);

      // Restore controls
      placeholders.forEach(({ control, replacement }) => {
        replacement.remove();
        control.style.display = "";
      });

      const nextIndex = batchIndex + 1;
      setBatchProgress({ done: nextIndex, total: students!.length });

      if (nextIndex >= students!.length) {
        await finishBatch();
      } else {
        // Move to next student — close dialog briefly so report-content unmounts/remounts cleanly
        setBatchOpen(false);
        await new Promise((r) => setTimeout(r, 150));
        setBatchIndex(nextIndex);
        setBatchOpen(true);
      }
    } catch (e: any) {
      toast({
        title: "Batch download failed",
        description: e?.message || "Could not generate PDFs",
        variant: "destructive",
      });
      finishBatch();
    }
  };

  const finishBatch = async () => {
    setBatchOpen(false);
    if (zipRef.current && batchProgress.done > 0) {
      try {
        const blob = await zipRef.current.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const className = classes?.find((c) => c.id === selectedClass)?.name || "class";
        a.href = url;
        a.download = `Reports_${className.replace(/\s+/g, "_")}_${selectedPeriod}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast({
          title: "Reports ready",
          description: `Downloaded ${batchProgress.done} report${batchProgress.done > 1 ? "s" : ""} as ZIP.`,
        });
      } catch (e: any) {
        toast({ title: "ZIP failed", description: e?.message, variant: "destructive" });
      }
    }
    zipRef.current = null;
  };

  const cancelBatch = () => {
    cancelRef.current = true;
    setBatchOpen(false);
    zipRef.current = null;
    toast({ title: "Cancelled", description: "Batch download cancelled." });
  };

  const getPeriodDisplayName = (period: string) => {
    switch (period) {
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

  const currentBatchStudent = students?.[batchIndex];

  return (
    <AppShell activeTab="reports">
      <div className="py-4">
        <div className="neu-card p-6 mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">Reports</h1>
          <p className="text-muted-foreground text-sm">Generate and view student report cards</p>
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
            disabled={!selectedClass || !students || students.length === 0 || batchOpen}
            onClick={handleDownloadAllClick}
          >
            <Download className="h-4 w-4" />
            Download All Reports
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

        {/* Single-student view dialog */}
        <StudentReportDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          studentId={selectedStudent}
          period={selectedPeriod}
          className={classes?.find(c => c.id === selectedClass)?.name || ""}
        />

        {/* Color/Grey choice dialog */}
        <AlertDialog open={modeDialogOpen} onOpenChange={setModeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Download all reports</AlertDialogTitle>
              <AlertDialogDescription>
                Choose how you want the reports rendered. All {students?.length || 0} report
                {(students?.length || 0) > 1 ? "s" : ""} will be packaged as a ZIP file.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <RadioGroup
              value={chosenMode}
              onValueChange={(v) => setChosenMode(v as "color" | "grey")}
              className="gap-3 py-2"
            >
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <RadioGroupItem value="color" id="mode-color" className="mt-1" />
                <Label htmlFor="mode-color" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Color mode</div>
                  <div className="text-xs text-muted-foreground">
                    Standard report card with full color (navy & gold accents).
                  </div>
                </Label>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <RadioGroupItem value="grey" id="mode-grey" className="mt-1" />
                <Label htmlFor="mode-grey" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Grey mode</div>
                  <div className="text-xs text-muted-foreground">
                    Ink-saving version — blue tones replaced with light grey.
                  </div>
                </Label>
              </div>
            </RadioGroup>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={startBatch}>
                <Download className="h-4 w-4 mr-2" />
                Start Download
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Batch processing dialog — mounts the report for the current student */}
        {batchOpen && currentBatchStudent && (
          <StudentReportDialog
            open={batchOpen}
            onOpenChange={(o) => { if (!o) cancelBatch(); }}
            studentId={currentBatchStudent.id}
            period={selectedPeriod}
            className={classes?.find(c => c.id === selectedClass)?.name || ""}
            forceGreyMode={chosenMode === "grey"}
            onReportReady={handleReportReady}
          />
        )}

        {/* Progress overlay */}
        {batchOpen && (
          <div className="fixed bottom-6 right-6 z-[100] bg-background border rounded-lg shadow-lg p-4 min-w-[260px]">
            <div className="text-sm font-semibold mb-1">Generating reports</div>
            <div className="text-xs text-muted-foreground mb-2">
              {batchProgress.done} of {batchProgress.total} — {currentBatchStudent?.full_name}
            </div>
            <div className="h-2 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(batchProgress.done / Math.max(batchProgress.total, 1)) * 100}%` }}
              />
            </div>
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={cancelBatch}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Reports;
