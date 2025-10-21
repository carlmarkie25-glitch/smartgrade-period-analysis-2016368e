import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Lock, Unlock, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useClasses, useClassSubjects } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useGrades, useAssessmentTypes, useSaveGrades } from "@/hooks/useGrades";
import { Skeleton } from "@/components/ui/skeleton";

const Gradebook = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("p1");
  const [isLocked, setIsLocked] = useState(true);
  const [editedGrades, setEditedGrades] = useState<Record<string, Record<string, number>>>({});

  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: classSubjects, isLoading: subjectsLoading } = useClassSubjects(selectedClass);
  const { data: students, isLoading: studentsLoading } = useStudents(selectedClass);
  const { data: assessmentTypes, isLoading: assessmentLoading } = useAssessmentTypes();
  const { data: grades, isLoading: gradesLoading } = useGrades(selectedSubject, selectedPeriod);
  const saveGradesMutation = useSaveGrades();

  // Initialize edited grades when data loads
  useEffect(() => {
    if (grades && students && assessmentTypes) {
      const initialGrades: Record<string, Record<string, number>> = {};
      students.forEach(student => {
        initialGrades[student.id] = {};
        assessmentTypes.forEach(at => {
          const existingGrade = grades.find(g => 
            g.student_id === student.id && g.assessment_type_id === at.id
          );
          initialGrades[student.id][at.id] = existingGrade ? Number(existingGrade.score) : 0;
        });
      });
      setEditedGrades(initialGrades);
    }
  }, [grades, students, assessmentTypes]);

  const handleGradeChange = (studentId: string, assessmentTypeId: string, value: string) => {
    const numValue = Math.max(0, Number(value) || 0);
    const maxScore = assessmentTypes?.find(at => at.id === assessmentTypeId)?.max_points || 0;
    const clampedValue = Math.min(numValue, maxScore);
    
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
        
        gradesToSave.push({
          id: existingGrade?.id,
          student_id: studentId,
          class_subject_id: selectedSubject,
          assessment_type_id: assessmentTypeId,
          period: selectedPeriod,
          score: editedGrades[studentId][assessmentTypeId],
          max_score: maxScore,
          is_locked: isLocked,
        });
      }
    }
    saveGradesMutation.mutate(gradesToSave);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gradebook</h1>
            <p className="text-muted-foreground">Enter and manage student grades</p>
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
              <SelectItem value="p1">Period 1</SelectItem>
              <SelectItem value="p2">Period 2</SelectItem>
              <SelectItem value="p3">Period 3</SelectItem>
              <SelectItem value="p4">Period 4</SelectItem>
              <SelectItem value="p5">Period 5</SelectItem>
              <SelectItem value="p6">Period 6</SelectItem>
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
                Period {selectedPeriod.replace('p', '')}
              </CardTitle>
              <CardDescription>
                {assessmentTypes && assessmentTypes.length > 0 
                  ? `Assessment breakdown: ${assessmentTypes.map(at => `${at.name} (${at.max_points})`).join(', ')}`
                  : 'No assessment types configured'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students && students.length > 0 ? (
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
                        {students.map((student) => {
                          const studentEditedGrades = editedGrades[student.id] || {};
                          const total = Object.values(studentEditedGrades).reduce((sum, score) => sum + score, 0);
                          
                          return (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.full_name}</TableCell>
                              {assessmentTypes?.map((at) => {
                                const currentValue = studentEditedGrades[at.id] || 0;
                                return (
                                  <TableCell key={at.id} className="text-center">
                                    {isLocked ? (
                                      <span className="text-muted-foreground">
                                        {currentValue > 0 ? currentValue : '-'}
                                      </span>
                                    ) : (
                                      <Input
                                        type="number"
                                        min="0"
                                        max={at.max_points}
                                        value={currentValue ?? ''}
                                        onChange={(e) => handleGradeChange(student.id, at.id, e.target.value)}
                                        className="w-20 text-center mx-auto"
                                      />
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center font-bold text-primary">
                                {total > 0 ? total.toFixed(0) : '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        // Reset to original grades
                        if (grades && students && assessmentTypes) {
                          const initialGrades: Record<string, Record<string, number>> = {};
                          students.forEach(student => {
                            initialGrades[student.id] = {};
                            assessmentTypes.forEach(at => {
                              const existingGrade = grades.find(g => 
                                g.student_id === student.id && g.assessment_type_id === at.id
                              );
                              initialGrades[student.id][at.id] = existingGrade ? Number(existingGrade.score) : 0;
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
      </main>
    </div>
  );
};

export default Gradebook;
