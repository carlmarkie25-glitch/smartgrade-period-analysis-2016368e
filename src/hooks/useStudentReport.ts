import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudentReport = (studentId: string, period: string) => {
  return useQuery({
    queryKey: ["student-report", studentId, period],
    queryFn: async () => {
      // Get student details
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(`
          *,
          classes (
            name,
            academic_years (
              year_name
            )
          )
        `)
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;

      // Get grades for this student and period
      const { data: grades, error: gradesError } = await supabase
        .from("student_grades")
        .select(`
          score,
          max_score,
          assessment_types (
            name,
            max_points
          ),
          class_subjects (
            subjects (
              name,
              code
            )
          )
        `)
        .eq("student_id", studentId)
        .eq("period", period as any);

      if (gradesError) throw gradesError;

      // Get period total (rank and total score)
      const { data: periodTotal, error: periodTotalError } = await supabase
        .from("student_period_totals")
        .select("*")
        .eq("student_id", studentId)
        .eq("period", period as any)
        .maybeSingle();

      if (periodTotalError) throw periodTotalError;

      // Group grades by subject
      const subjectGrades = new Map<string, {
        name: string;
        code: string;
        total: number;
        max: number;
        assessments: Array<{ type: string; score: number; max: number }>;
      }>();

      grades?.forEach((grade: any) => {
        const subjectName = grade.class_subjects?.subjects?.name || "Unknown";
        const subjectCode = grade.class_subjects?.subjects?.code || "N/A";
        
        const existing = subjectGrades.get(subjectName);
        const assessment = {
          type: grade.assessment_types?.name || "Assessment",
          score: Number(grade.score),
          max: Number(grade.max_score),
        };

        if (existing) {
          existing.total += Number(grade.score);
          existing.max += Number(grade.max_score);
          existing.assessments.push(assessment);
        } else {
          subjectGrades.set(subjectName, {
            name: subjectName,
            code: subjectCode,
            total: Number(grade.score),
            max: Number(grade.max_score),
            assessments: [assessment],
          });
        }
      });

      // Convert to array and calculate percentages
      const subjects = Array.from(subjectGrades.values()).map((subject) => ({
        ...subject,
        percentage: Math.round((subject.total / subject.max) * 100),
      }));

      // Calculate overall average
      const overallTotal = subjects.reduce((sum, s) => sum + s.total, 0);
      const overallMax = subjects.reduce((sum, s) => sum + s.max, 0);
      const overallAverage = overallMax > 0 ? Math.round((overallTotal / overallMax) * 100) : 0;

      return {
        student,
        subjects,
        periodTotal,
        overallAverage,
        period,
      };
    },
    enabled: !!studentId && !!period,
  });
};
