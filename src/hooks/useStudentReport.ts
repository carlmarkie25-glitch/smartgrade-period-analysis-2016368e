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

      // Determine which periods to fetch based on report type
      let periodsToFetch: any[] = [period];
      
      if (period === 'semester1') {
        periodsToFetch = ['p1', 'p2', 'p3', 'exam_s1'];
      } else if (period === 'semester2') {
        periodsToFetch = ['p4', 'p5', 'p6', 'exam_s2'];
      } else if (period === 'yearly') {
        periodsToFetch = ['p1', 'p2', 'p3', 'exam_s1', 'p4', 'p5', 'p6', 'exam_s2'];
      }

      // Get grades for this student and period(s)
      const { data: grades, error: gradesError } = await supabase
        .from("student_grades")
        .select(`
          score,
          max_score,
          period,
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
        .in("period", periodsToFetch);

      if (gradesError) throw gradesError;

      // Get period totals (rank and total score) for all relevant periods
      const { data: periodTotals, error: periodTotalsError } = await supabase
        .from("student_period_totals")
        .select("*")
        .eq("student_id", studentId)
        .in("period", periodsToFetch);

      if (periodTotalsError) throw periodTotalsError;

      // Get total count of students in the class (for rank display as "X/Y")
      const periodCounts: Record<string, number> = {};
      const studentClassId = student?.class_id;
      
      if (studentClassId) {
        const { count } = await supabase
          .from("students")
          .select("id", { count: 'exact', head: true })
          .eq("class_id", studentClassId);
        
        // All periods use the same count (number of students in the class)
        const totalStudents = count || 0;
        for (const p of periodsToFetch) {
          periodCounts[p] = totalStudents;
        }
      }

      // Get semester/yearly totals if applicable
      let yearlyTotal = null;
      if (period === 'semester1' || period === 'semester2' || period === 'yearly') {
        const { data: yearlyData, error: yearlyError } = await supabase
          .from("student_yearly_totals")
          .select("*")
          .eq("student_id", studentId)
          .maybeSingle();
        
        if (!yearlyError) yearlyTotal = yearlyData;
      }

      // Create a map for easy lookup
      const periodTotalsMap = new Map(periodTotals?.map(pt => [pt.period, pt]) || []);

      // Check if this is a semester report
      const isSemesterReport = period === 'semester1' || period === 'semester2' || period === 'yearly';

      if (isSemesterReport) {
        // For semester reports, organize by subject and period
        const subjectGrades = new Map<string, {
          name: string;
          code: string;
          periods: { [key: string]: { score: number; max: number } };
        }>();

        grades?.forEach((grade: any) => {
          const subjectName = grade.class_subjects?.subjects?.name || "Unknown";
          const subjectCode = grade.class_subjects?.subjects?.code || "N/A";
          const gradePeriod = grade.period;
          
          const existing = subjectGrades.get(subjectName);

          if (existing) {
            if (!existing.periods[gradePeriod]) {
              existing.periods[gradePeriod] = { score: 0, max: 0 };
            }
            existing.periods[gradePeriod].score += Number(grade.score);
            existing.periods[gradePeriod].max += Number(grade.max_score);
          } else {
            subjectGrades.set(subjectName, {
              name: subjectName,
              code: subjectCode,
              periods: {
                [gradePeriod]: {
                  score: Number(grade.score),
                  max: Number(grade.max_score),
                }
              },
            });
          }
        });

        // Convert to array and calculate percentages for each period
        const subjects = Array.from(subjectGrades.values()).map((subject) => {
          const periodData: any = {};
          let semesterTotal = 0;
          let semesterMax = 0;

          Object.keys(subject.periods).forEach(p => {
            const pData = subject.periods[p];
            const percentage = pData.max > 0 ? Math.floor((pData.score / pData.max) * 1000) / 10 : 0;
            periodData[p] = { ...pData, percentage };
            semesterTotal += pData.score;
            semesterMax += pData.max;
          });

          const semesterAverage = semesterMax > 0 ? Math.floor((semesterTotal / semesterMax) * 1000) / 10 : 0;

          return {
            ...subject,
            periods: periodData,
            semesterAverage,
          };
        });

        // Calculate overall average
        const overallTotal = subjects.reduce((sum, s) => sum + s.semesterAverage, 0);
        const overallAverage = subjects.length > 0 ? Math.floor((overallTotal / subjects.length) * 10) / 10 : 0;

        return {
          student,
          subjects,
          periodTotals: periodTotalsMap,
          periodCounts,
          yearlyTotal,
          overallAverage,
          period,
          isSemesterReport: true,
        };
      } else {
        // Original logic for individual period reports
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

        // Convert to array without calculating percentage
        const subjects = Array.from(subjectGrades.values());

        // Calculate overall average (truncate to 1 decimal)
        const overallTotal = subjects.reduce((sum, s) => sum + s.total, 0);
        const overallMax = subjects.reduce((sum, s) => sum + s.max, 0);
        const overallAverage = overallMax > 0 ? Math.floor((overallTotal / overallMax) * 1000) / 10 : 0;

        return {
          student,
          subjects,
          periodTotals: periodTotalsMap,
          periodCounts,
          yearlyTotal,
          overallAverage,
          period,
          isSemesterReport: false,
        };
      }

    },
    enabled: !!studentId && !!period,
  });
};
