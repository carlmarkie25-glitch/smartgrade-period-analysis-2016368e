import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Lock, Unlock, Save, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useClasses, useClassSubjects } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useGrades, useAssessmentTypes, useSaveGrades } from "@/hooks/useGrades";
import { Skeleton } from "@/components/ui/skeleton";
import { isKindergartenClass, scoreToLetter, letterColorClass, KG_SCALE } from "@/lib/kindergarten";

const Gradebook = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("p1");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLocked, setIsLocked] = useState(true);
  const [editedGrades, setEditedGrades] = useState<Record<string, Record<string, number | null>>>({});

  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: classSubjects, isLoading: subjectsLoading } = useClassSubjects(selectedClass);
  const { data: students, isLoading: studentsLoading } = useStudents(selectedClass);
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
      <div className="py-4">
        <div className="neu-card p-6 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Gradebook</h1>
            <p className="text-muted-foreground text-sm">Enter and manage student grades</p>
          </div>
          <Button 
            variant={isLocked ? "outline" : "default"} 
            className="gap-2"
            onClick={() => setIsLocked(!isLocked)}
          >
            {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {isLocked ? "Locked" : "Unlocked"}
          </Button>
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

          <Select 
            value={selectedSubject} 
            onValueChange={setSelectedSubject}
            disabled={!selectedClass}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjectsLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : classSubjects?.length === 0 ? (
                <SelectItem value="none" disabled>No subjects for this class</SelectItem>
              ) : (
                classSubjects?.map((cs) => (
                  <SelectItem key={cs.id} value={cs.id}>
                    {cs.subjects?.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Semester 1</div>
              <SelectItem value="p1">Period 1</SelectItem>
              <SelectItem value="p2">Period 2</SelectItem>
              <SelectItem value="p3">Period 3</SelectItem>
              <SelectItem value="exam_s1">Exam S1</SelectItem>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground mt-2">Semester 2</div>
              <SelectItem value="p4">Period 4</SelectItem>
              <SelectItem value="p5">Period 5</SelectItem>
              <SelectItem value="p6">Period 6</SelectItem>
              <SelectItem value="exam_s2">Exam S2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!selectedClass || !selectedSubject ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                Please select a class and subject to view the gradebook
              </p>
            </CardContent>
          </Card>
        ) : studentsLoading || gradesLoading || assessmentLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {classSubjects?.find(cs => cs.id === selectedSubject)?.subjects?.name} - 
                {classes?.find(c => c.id === selectedClass)?.name} - 
                {(() => {
                  switch(selectedPeriod) {
                    case 'p1': return 'Period 1';
                    case 'p2': return 'Period 2';
                    case 'p3': return 'Period 3';
                    case 'p4': return 'Period 4';
                    case 'p5': return 'Period 5';
                    case 'p6': return 'Period 6';
                    case 'exam_s1': return 'Exam S1';
                    case 'exam_s2': return 'Exam S2';
                    default: return selectedPeriod;
                  }
                })()}
              </CardTitle>
              <CardDescription>
                {assessmentTypes && assessmentTypes.length > 0 
                  ? `Assessment breakdown: ${assessmentTypes.map(at => `${at.name} (${at.max_points})`).join(', ')}. Empty fields show as "I" (Incomplete). Totals under 60% show as "I".`
                  : 'No assessment types configured'
                }
                {isKg && (
                  <span className="block mt-2 text-xs text-foreground">
                    <strong>Kindergarten letter scale:</strong>{" "}
                    {KG_SCALE.map((t) => `${t.letter} ${t.min}-${t.max}`).join(" • ")} • &lt;60 not allowed
                  </span>
                )}
              </CardDescription>
              <div className="mt-4">
                <label className="text-sm font-medium text-foreground">Search Students</label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, student ID, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {students && students.length > 0 ? (
                <>
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No students found matching "{searchTerm}"</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student Name</TableHead>
                              {assessmentTypes?.map((at) => (
                                <TableHead key={at.id} className="text-center">
                                  {at.name}<br/>({at.max_points})
                                </TableHead>
                              ))}
                              <TableHead className="text-center font-bold">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStudents.map((student) => {
                          const studentEditedGrades = editedGrades[student.id] || {};

                          const hasAnyMissing =
                            assessmentTypes?.some(
                              (at) =>
                                studentEditedGrades[at.id] === null ||
                                studentEditedGrades[at.id] === undefined
                            ) ?? false;

                          const totalScore = (assessmentTypes ?? []).reduce(
                            (sum, at) => sum + (studentEditedGrades[at.id] ?? 0),
                            0
                          );
                          const totalMax = (assessmentTypes ?? []).reduce(
                            (sum, at) => sum + (at.max_points ?? 0),
                            0
                          );
                          const totalPercent = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

                          const isTotalIncomplete = hasAnyMissing || totalPercent < 60;

                          return (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.full_name}</TableCell>
                              {assessmentTypes?.map((at) => {
                                const currentValue = studentEditedGrades[at.id];
                                const maxPts = at.max_points || 0;
                                // A grade below 60% of max is treated as Incomplete ("I")
                                const isBelowThreshold =
                                  currentValue !== null &&
                                  currentValue !== undefined &&
                                  maxPts > 0 &&
                                  (currentValue / maxPts) * 100 < 60;
                                const isIncomplete =
                                  currentValue === null || currentValue === undefined || isBelowThreshold;
                                const isRedGrade = false;
                                return (
                                  <TableCell key={at.id} className="text-center">
                                    {isLocked ? (
                                      <span
                                        className={
                                          isIncomplete
                                            ? "text-orange-500 font-bold"
                                            : isRedGrade
                                              ? "text-red-500 font-semibold"
                                              : "text-muted-foreground"
                                        }
                                      >
                                        {isIncomplete ? "I" : currentValue}
                                      </span>
                                    ) : (
                                      <Input
                                        type="number"
                                        min="0"
                                        max={at.max_points}
                                        value={currentValue === null || currentValue === undefined ? "" : currentValue}
                                        onChange={(e) =>
                                          handleGradeChange(student.id, at.id, e.target.value)
                                        }
                                        className={`w-20 text-center mx-auto ${
                                          isIncomplete &&
                                          currentValue !== null &&
                                          currentValue !== undefined
                                            ? "text-orange-500 font-bold border-orange-300"
                                            : isRedGrade
                                              ? "text-red-500 font-semibold"
                                              : ""
                                        }`}
                                        placeholder=""
                                      />
                                    )}
                                    {isKg && (() => {
                                      const letter = scoreToLetter(
                                        typeof currentValue === "number" ? currentValue : null,
                                        at.max_points,
                                      );
                                      return (
                                        <div
                                          className={`mt-1 text-xs font-bold ${letterColorClass(letter)}`}
                                          title={letter ? "KG letter grade" : "Below 60 — not allowed"}
                                        >
                                          {letter ?? "—"}
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center font-bold">
                                {isTotalIncomplete ? (
                                  <span className="text-orange-500">I</span>
                                ) : (
                                  <span className="text-primary">
                                    {totalScore > 0 ? totalScore.toFixed(0) : "-"}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {searchTerm ? (
                      <p>Showing {filteredStudents.length} of {students.length} students matching "{searchTerm}"</p>
                    ) : (
                      <p>Total students: {students.length}</p>
                    )}
                  </div>
                    </>
                  )}
                  <div className="mt-6 flex justify-end gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        // Reset to original grades
                        if (grades && students && assessmentTypes) {
                          const initialGrades: Record<string, Record<string, number | null>> = {};
                          students.forEach(student => {
                            initialGrades[student.id] = {};
                            assessmentTypes.forEach(at => {
                              const existingGrade = grades.find(g => 
                                g.student_id === student.id && g.assessment_type_id === at.id
                              );
                              if (existingGrade && existingGrade.score !== null && existingGrade.score !== undefined) {
                                initialGrades[student.id][at.id] = Number(existingGrade.score);
                              } else {
                                initialGrades[student.id][at.id] = null;
                              }
                            });
                          });
                          setEditedGrades(initialGrades);
                        }
                      }}
                      disabled={isLocked}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveGrades}
                      disabled={isLocked || saveGradesMutation.isPending}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saveGradesMutation.isPending ? "Saving..." : "Save Grades"}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No students found in this class
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default Gradebook;
