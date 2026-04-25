import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Save, Search, Send, Download, BookOpen } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useClasses, useClassSubjects } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useGrades, useAssessmentTypes, useSaveGrades } from "@/hooks/useGrades";
import { useGradeLock, useSubmitGrades } from "@/hooks/useGradeLocks";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import AcademicYearSelector from "@/components/AcademicYearSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { isKindergartenClass, scoreToLetter, letterColorClass, KG_SCALE } from "@/lib/kindergarten";
import { isAggregateIncomplete } from "@/lib/grading";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Gradebook = () => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("p1");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLocked, setIsLocked] = useState(true);
  const [editedGrades, setEditedGrades] = useState<Record<string, Record<string, number | null>>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const { data: years } = useAcademicYears();
  const { data: allClasses, isLoading: classesLoading } = useClasses();

  // Default the year selector to the current academic year on first load.
  useEffect(() => {
    if (!selectedYear && years && years.length > 0) {
      const current = years.find((y) => y.is_current) ?? years[0];
      setSelectedYear(current.id);
    }
  }, [years, selectedYear]);

  // Filter the class list to the selected academic year.
  const classes = useMemo(() => {
    if (!allClasses) return [];
    if (!selectedYear) return allClasses;
    return allClasses.filter((c: any) => c.academic_year_id === selectedYear);
  }, [allClasses, selectedYear]);

  // Reset class/subject when year changes if current selection isn't in the filtered list.
  useEffect(() => {
    if (selectedClass && !classes.find((c: any) => c.id === selectedClass)) {
      setSelectedClass("");
      setSelectedSubject("");
    }
  }, [classes, selectedClass]);

  const { data: classSubjects, isLoading: subjectsLoading } = useClassSubjects(selectedClass);
  const { data: students, isLoading: studentsLoading } = useStudents(selectedClass);
  const { data: gradeLock } = useGradeLock(selectedSubject, selectedPeriod);
  const submitMutation = useSubmitGrades();
  const isPeriodLocked = !!gradeLock?.is_locked;
  const selectedClassObj = classes?.find((c) => c.id === selectedClass);
  const isKg = isKindergartenClass(selectedClassObj);
  const departmentId = (selectedClassObj as any)?.department_id ?? (selectedClassObj as any)?.departments?.id;
  // Always scope assessment types to the class's department so admins see
  // exactly the set they defined — no cross-department duplication.
  const { data: assessmentTypes, isLoading: assessmentLoading } = useAssessmentTypes(departmentId);
  const { data: grades, isLoading: gradesLoading } = useGrades(selectedSubject, selectedPeriod);
  const saveGradesMutation = useSaveGrades();

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") {
      return students || [];
    }

    const term = searchTerm.toLowerCase().trim();
    return (students || []).filter((student) => {
      const nameMatch = (student.full_name || "").toLowerCase().includes(term);
      const studentIdMatch = (student.student_id || "").toLowerCase().includes(term);
      const emailMatch = ((student as any).email || "").toLowerCase().includes(term);

      return nameMatch || studentIdMatch || emailMatch;
    });
  }, [students, searchTerm]);

  // Initialize edited grades when data loads
  useEffect(() => {
    if (grades && students && assessmentTypes) {
      const initialGrades: Record<string, Record<string, number | null>> = {};
      students.forEach(student => {
        initialGrades[student.id] = {};
        assessmentTypes.forEach(at => {
          const existingGrade = grades.find(g => 
            g.student_id === student.id && g.assessment_type_id === at.id
          );
          // null represents incomplete (score was not entered or below 60)
          if (existingGrade && existingGrade.score !== null && existingGrade.score !== undefined) {
            initialGrades[student.id][at.id] = Number(existingGrade.score);
          } else {
            initialGrades[student.id][at.id] = null;
          }
        });
      });
      setEditedGrades(initialGrades);
    }
  }, [grades, students, assessmentTypes]);

  const handleGradeChange = (studentId: string, assessmentTypeId: string, value: string) => {
    // Allow empty string during typing - store as null (incomplete)
    if (value === '') {
      setEditedGrades(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [assessmentTypeId]: null,
        },
      }));
      return;
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    
    const maxScore = assessmentTypes?.find(at => at.id === assessmentTypeId)?.max_points || 0;
    // Clamp value between 0 and maxScore
    const clampedValue = Math.min(Math.max(0, numValue), maxScore);
    
    // If grade is below 60, it will be saved but marked as incomplete on reports
    setEditedGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [assessmentTypeId]: clampedValue,
      },
    }));
  };

  const handleDownloadCsv = () => {
    if (!filteredStudents || filteredStudents.length === 0 || !assessmentTypes) return;

    const className = classes?.find((c) => c.id === selectedClass)?.name ?? "class";
    const subjectName =
      classSubjects?.find((cs) => cs.id === selectedSubject)?.subjects?.name ?? "subject";
    const periodLabel = (() => {
      switch (selectedPeriod) {
        case "p1": return "Period 1";
        case "p2": return "Period 2";
        case "p3": return "Period 3";
        case "p4": return "Period 4";
        case "p5": return "Period 5";
        case "p6": return "Period 6";
        case "exam_s1": return "Exam S1";
        case "exam_s2": return "Exam S2";
        default: return selectedPeriod;
      }
    })();

    const escape = (val: unknown) => {
      const s = val === null || val === undefined ? "" : String(val);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const headers = [
      "Student ID",
      "Student Name",
      ...assessmentTypes.map((at) => `${at.name} (${at.max_points})`),
      "Total Score",
      "Total Max",
      "Percentage",
    ];

    const rows = filteredStudents.map((student) => {
      const studentEditedGrades = editedGrades[student.id] || {};
      const totalScore = assessmentTypes.reduce(
        (sum, at) => sum + (studentEditedGrades[at.id] ?? 0),
        0
      );
      const totalMax = assessmentTypes.reduce((sum, at) => sum + (at.max_points ?? 0), 0);
      const percentage = totalMax > 0 ? Math.trunc((totalScore / totalMax) * 100) : "";

      return [
        (student as any).student_id ?? "",
        student.full_name ?? "",
        ...assessmentTypes.map((at) => {
          const v = studentEditedGrades[at.id];
          return v === null || v === undefined ? "" : v;
        }),
        totalScore,
        totalMax,
        percentage,
      ].map(escape).join(",");
    });

    const csv = [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = `${className}_${subjectName}_${periodLabel}`.replace(/[^a-z0-9]+/gi, "_");
    link.href = url;
    link.download = `gradebook_${safeName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveGrades = () => {
    const gradesToSave = [];
    for (const studentId in editedGrades) {
      for (const assessmentTypeId in editedGrades[studentId]) {
        const existingGrade = grades?.find(g => 
          g.student_id === studentId && g.assessment_type_id === assessmentTypeId
        );
        const maxScore = assessmentTypes?.find(at => at.id === assessmentTypeId)?.max_points || 0;
        const gradeValue = editedGrades[studentId][assessmentTypeId];
        
        // Skip if no change (existing null and still null without an id means student may not have a row yet)
        // But we always send a row so students get their grade row created.

        const gradeData: Record<string, unknown> = {
          student_id: studentId,
          class_subject_id: selectedSubject,
          assessment_type_id: assessmentTypeId,
          period: selectedPeriod,
          // Store null for empty grades, actual value otherwise
          score: gradeValue,
          max_score: maxScore,
          is_locked: isLocked,
        };
        gradesToSave.push(gradeData);
      }
    }
    saveGradesMutation.mutate(gradesToSave);
  };

  return (
    <AppShell activeTab="gradebook">
      <div className="flex flex-col gap-6 pb-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] glass-panel flex items-center justify-center border border-border p-1.5 shadow-none">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground">
                <BookOpen className="size-8" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Academic Records</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Gradebook
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-muted/50 backdrop-blur-xl px-4 py-2 rounded-[1.5rem] border border-border self-start lg:self-center">
            {isPeriodLocked && (
              <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md">
                <Lock className="h-3 w-3 mr-1" /> Period Locked
              </Badge>
            )}
            <Button
              variant="ghost"
              className={`h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isLocked ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}
              onClick={() => setIsLocked(!isLocked)}
              disabled={isPeriodLocked}
            >
              {isLocked ? <Lock className="h-3 w-3 mr-2" /> : <Unlock className="h-3 w-3 mr-2" />}
              {isLocked ? "Locked" : "Unlocked"}
            </Button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AcademicYearSelector 
            value={selectedYear} 
            onChange={setSelectedYear} 
            className="bg-white/5 border border-white/10 h-12 text-xs font-black text-white uppercase tracking-widest px-6 rounded-xl hover:bg-white/10 transition-all"
          />
          
          <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="bg-white/5 border border-white/10 h-12 text-xs font-black text-white uppercase tracking-widest px-6 rounded-xl hover:bg-white/10 transition-all">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-2xl shadow-xl border-white/10 text-white">
              {classesLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : classes?.length === 0 ? (
                <SelectItem value="none" disabled>No classes available</SelectItem>
              ) : (
                classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
            <SelectTrigger className="bg-white/5 border border-white/10 h-12 text-xs font-black text-white uppercase tracking-widest px-6 rounded-xl hover:bg-white/10 transition-all">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-2xl shadow-xl border-white/10 text-white">
              {subjectsLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : classSubjects?.length === 0 ? (
                <SelectItem value="none" disabled>No subjects</SelectItem>
              ) : (
                classSubjects?.map((cs) => (
                  <SelectItem key={cs.id} value={cs.id}>{cs.subjects?.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="bg-white/5 border border-white/10 h-12 text-xs font-black text-white uppercase tracking-widest px-6 rounded-xl hover:bg-white/10 transition-all">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-2xl shadow-xl border-white/10 text-white">
              <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">Semester 1</div>
              <SelectItem value="p1">Period 1</SelectItem>
              <SelectItem value="p2">Period 2</SelectItem>
              <SelectItem value="p3">Period 3</SelectItem>
              <SelectItem value="exam_s1">Exam S1</SelectItem>
              <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Semester 2</div>
              <SelectItem value="p4">Period 4</SelectItem>
              <SelectItem value="p5">Period 5</SelectItem>
              <SelectItem value="p6">Period 6</SelectItem>
              <SelectItem value="exam_s2">Exam S2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!selectedClass || !selectedSubject ? (
          <div className="glass-card p-20 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Search className="size-8 text-muted-foreground" />
             </div>
             <h3 className="text-xl font-black text-foreground tracking-tight">Gradebook Ready</h3>
             <p className="text-sm text-muted-foreground mt-2 max-w-xs">Select a class and subject above to begin recording academic performance.</p>
          </div>
        ) : studentsLoading || gradesLoading || assessmentLoading ? (
          <div className="glass-card p-12">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64 bg-muted" />
              <Skeleton className="h-64 w-full rounded-2xl bg-muted" />
            </div>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="p-8 border-b border-border">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tighter">
                    {classSubjects?.find(cs => cs.id === selectedSubject)?.subjects?.name} • {classes?.find(c => c.id === selectedClass)?.name}
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {assessmentTypes && assessmentTypes.length > 0 
                      ? assessmentTypes.map(at => `${at.name} (${at.max_points})`).join(' · ')
                      : 'No assessment types configured'
                    }
                  </p>
                </div>
                
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Quick student search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 bg-muted border-none h-12 text-sm font-bold text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {isKg && (
                <div className="mt-6 p-4 glass-panel bg-primary/5 border-primary/10">
                  <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Kindergarten Scale</p>
                  <p className="text-xs font-bold text-muted-foreground">
                    {KG_SCALE.map((t) => `${t.letter}: ${t.min}-${t.max}`).join(" • ")}
                  </p>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="h-14 px-8 text-sm font-semibold text-muted-foreground uppercase tracking-widest">Student Identity</TableHead>
                    {assessmentTypes?.map((at) => (
                      <TableHead key={at.id} className="h-14 text-center text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">
                        {at.name} <span className="text-white/20">({at.max_points})</span>
                      </TableHead>
                    ))}
                    <TableHead className="h-14 text-center text-sm font-black text-secondary uppercase tracking-[0.2em]">Aggregated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={(assessmentTypes?.length || 0) + 2} className="h-40 text-center">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">No students found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const studentEditedGrades = editedGrades[student.id] || {};
                      const hasAnyMissing = assessmentTypes?.some(at => studentEditedGrades[at.id] === null || studentEditedGrades[at.id] === undefined) ?? false;
                      const totalScore = (assessmentTypes ?? []).reduce((sum, at) => sum + (studentEditedGrades[at.id] ?? 0), 0);
                      const totalMax = (assessmentTypes ?? []).reduce((sum, at) => sum + (at.max_points ?? 0), 0);
                      const isTotalIncomplete = isAggregateIncomplete(totalScore, totalMax, hasAnyMissing);

                      return (
                        <TableRow key={student.id} className="transition-colors group even:bg-primary/5 hover:bg-primary/10">
                          <TableCell className="px-8 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all border border-white/10">
                                <span className="text-[10px] font-black text-white/40 uppercase group-hover:text-white transition-colors">
                                  {student.full_name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className="text-sm font-black text-white tracking-tight">{student.full_name}</span>
                            </div>
                          </TableCell>
                          {assessmentTypes?.map((at) => {
                            const currentValue = studentEditedGrades[at.id];
                            const isIncomplete = currentValue === null || currentValue === undefined;
                            const isWarning = currentValue !== null && currentValue !== undefined && currentValue >= 60 && currentValue <= 69;
                            
                            return (
                              <TableCell key={at.id} className="text-center p-4">
                                {(isLocked || isPeriodLocked) ? (
                                  <span className={`text-base font-black tracking-tight ${isIncomplete ? "text-amber-400" : isWarning ? "text-rose-400" : "text-white"}`}>
                                    {isIncomplete ? "I" : currentValue}
                                  </span>
                                ) : (
                                  <Input
                                    type="number"
                                    min="0"
                                    max={at.max_points}
                                    value={isIncomplete ? "" : currentValue}
                                    onChange={(e) => handleGradeChange(student.id, at.id, e.target.value)}
                                    className={`w-20 h-10 text-center mx-auto text-base font-black transition-all border-transparent focus:border-white/20 focus:bg-white/10 ${isIncomplete ? "text-cyan-400 bg-cyan-400/10" : isWarning ? "text-rose-400 bg-rose-400/10" : "bg-white/5 text-white hover:bg-white/10"}`}
                                  />
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center p-4">
                             <div className="inline-flex items-center justify-center min-w-[60px] h-10 font-black text-lg text-secondary tracking-tighter">
                                {isTotalIncomplete ? "I " : ""}
                                {totalMax > 0 ? totalScore : "--"}
                             </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="p-6 sm:p-8 bg-muted/10 border-t border-border flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center lg:text-left">
                {filteredStudents.length} Students Active in Period
              </div>
              
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
                <Button variant="ghost" className="w-full sm:w-auto h-11 px-6 rounded-2xl bg-muted border-none text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/80" onClick={handleDownloadCsv}>
                  <Download className="size-4 mr-2" /> Export CSV
                </Button>
                
                <div className="hidden sm:block w-px h-8 bg-border mx-2" />
                
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto h-11 px-6 rounded-2xl bg-muted border-none text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  disabled={isLocked || isPeriodLocked}
                  onClick={() => {
                    if (grades && students && assessmentTypes) {
                      const initialGrades: Record<string, Record<string, number | null>> = {};
                      students.forEach(student => {
                        initialGrades[student.id] = {};
                        assessmentTypes.forEach(at => {
                          const existingGrade = grades.find(g => g.student_id === student.id && g.assessment_type_id === at.id);
                          initialGrades[student.id][at.id] = (existingGrade && existingGrade.score !== null) ? Number(existingGrade.score) : null;
                        });
                      });
                      setEditedGrades(initialGrades);
                    }
                  }}
                >
                  Discard Changes
                </Button>
                
                <Button
                  className="w-full sm:w-auto h-11 px-8 rounded-2xl bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest hover:bg-secondary/90 transition-all shadow-lg"
                  disabled={isLocked || isPeriodLocked || saveGradesMutation.isPending}
                  onClick={handleSaveGrades}
                >
                  <Save className="size-4 mr-2" />
                  {saveGradesMutation.isPending ? "Saving..." : "Commit Grades"}
                </Button>
                
                <Button
                  className="w-full sm:w-auto h-11 px-8 rounded-2xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg"
                  disabled={isPeriodLocked || submitMutation.isPending}
                  onClick={() => setShowSubmitConfirm(true)}
                >
                  <Send className="size-4 mr-2" />
                  {isPeriodLocked ? "Submitted" : "Finalize Period"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
          <AlertDialogContent className="bg-background backdrop-blur-2xl border-border text-foreground rounded-[2rem] p-10">
            <AlertDialogHeader>
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                <Send className="size-8 text-primary" />
              </div>
              <AlertDialogTitle className="text-3xl font-black tracking-tighter">Submit Period Records?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed pt-2">
                Once finalized, academic records for this class and subject will be locked. 
                Any further adjustments will require administrative override.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-10 gap-4">
              <AlertDialogCancel className="h-12 px-8 rounded-2xl bg-muted border-none text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted/80">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90"
                onClick={() => {
                  submitMutation.mutate({ classSubjectId: selectedSubject, period: selectedPeriod });
                  setShowSubmitConfirm(false);
                }}
              >
                Yes, Finalize
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
};

export default Gradebook;
