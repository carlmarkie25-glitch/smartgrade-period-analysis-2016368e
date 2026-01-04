import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Helper function to check if a score is incomplete (null, undefined, or below 60)
const isIncompleteScore = (score: number | null | undefined): boolean => {
  return score === null || score === undefined || score < 60;
};

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

      // Check if student has any incomplete grades (null, undefined, or < 60)
      const hasIncompleteGrades = grades?.some((grade: any) => isIncompleteScore(grade.score)) || false;

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
          periods: { [key: string]: { score: number | null; max: number; isIncomplete: boolean } };
        }>();

        grades?.forEach((grade: any) => {
          const subjectName = grade.class_subjects?.subjects?.name || "Unknown";
          const subjectCode = grade.class_subjects?.subjects?.code || "N/A";
          const gradePeriod = grade.period;
          const scoreValue = grade.score;
          const isIncomplete = isIncompleteScore(scoreValue);
          
          const existing = subjectGrades.get(subjectName);

          if (existing) {
            if (!existing.periods[gradePeriod]) {
              existing.periods[gradePeriod] = { score: 0, max: 0, isIncomplete: false };
            }
            existing.periods[gradePeriod].score = (existing.periods[gradePeriod].score || 0) + (scoreValue || 0);
            existing.periods[gradePeriod].max += Number(grade.max_score);
            existing.periods[gradePeriod].isIncomplete = existing.periods[gradePeriod].isIncomplete || isIncomplete;
          } else {
            subjectGrades.set(subjectName, {
              name: subjectName,
              code: subjectCode,
              periods: {
                [gradePeriod]: {
                  score: scoreValue || 0,
                  max: Number(grade.max_score),
                  isIncomplete,
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
          let hasAnyIncomplete = false;

          Object.keys(subject.periods).forEach(p => {
            const pData = subject.periods[p];
            const percentage = pData.max > 0 ? Math.floor((pData.score! / pData.max) * 1000) / 10 : 0;
            periodData[p] = { ...pData, percentage };
            semesterTotal += pData.score || 0;
            semesterMax += pData.max;
            if (pData.isIncomplete) hasAnyIncomplete = true;
          });

          // Only calculate semester average if all required periods have grades and no incomplete
          const subjectHasAllPeriods = periodsToFetch.every(p => subject.periods[p]);
          const semesterAverage = (subjectHasAllPeriods && semesterMax > 0 && !hasAnyIncomplete) 
            ? Math.floor((semesterTotal / semesterMax) * 1000) / 10 
            : null;

          return {
            ...subject,
            periods: periodData,
            semesterAverage,
            hasIncomplete: hasAnyIncomplete,
          };
        });

        // Check if any subject has incomplete grades
        const anySubjectIncomplete = subjects.some(s => s.hasIncomplete);

        // Calculate overall average only if all subjects have their semester averages and no incomplete grades
        const subjectsWithAverages = subjects.filter(s => s.semesterAverage !== null);
        const overallTotal = subjectsWithAverages.reduce((sum, s) => sum + (s.semesterAverage || 0), 0);
        const overallAverage = (subjectsWithAverages.length > 0 && subjectsWithAverages.length === subjects.length && !hasIncompleteGrades) 
          ? Math.floor((overallTotal / subjects.length) * 10) / 10 
          : null;

        return {
          student,
          subjects,
          periodTotals: periodTotalsMap,
          periodCounts,
          yearlyTotal,
          overallAverage,
          period,
          isSemesterReport: true,
          hasIncomplete: hasIncompleteGrades || anySubjectIncomplete,
        };
      } else {
        // Original logic for individual period reports
        const subjectGrades = new Map<string, {
          name: string;
          code: string;
          total: number;
          max: number;
          hasIncomplete: boolean;
          assessments: Array<{ type: string; score: number | null; max: number; isIncomplete: boolean }>;
        }>();

        grades?.forEach((grade: any) => {
          const subjectName = grade.class_subjects?.subjects?.name || "Unknown";
          const subjectCode = grade.class_subjects?.subjects?.code || "N/A";
          const scoreValue = grade.score;
          const isIncomplete = isIncompleteScore(scoreValue);
          
          const existing = subjectGrades.get(subjectName);
          const assessment = {
            type: grade.assessment_types?.name || "Assessment",
            score: scoreValue,
            max: Number(grade.max_score),
            isIncomplete,
          };

          if (existing) {
            existing.total += scoreValue || 0;
            existing.max += Number(grade.max_score);
            existing.hasIncomplete = existing.hasIncomplete || isIncomplete;
            existing.assessments.push(assessment);
          } else {
            subjectGrades.set(subjectName, {
              name: subjectName,
              code: subjectCode,
              total: scoreValue || 0,
              max: Number(grade.max_score),
              hasIncomplete: isIncomplete,
              assessments: [assessment],
            });
          }
        });

        // Convert to array without calculating percentage
        const subjects = Array.from(subjectGrades.values());

        // Check if any subject has incomplete grades
        const anySubjectIncomplete = subjects.some(s => s.hasIncomplete);

        // Calculate overall average only if no incomplete grades (truncate to 1 decimal)
        const overallTotal = subjects.reduce((sum, s) => sum + s.total, 0);
        const overallMax = subjects.reduce((sum, s) => sum + s.max, 0);
        const overallAverage = (overallMax > 0 && !hasIncompleteGrades && !anySubjectIncomplete) 
          ? Math.floor((overallTotal / overallMax) * 1000) / 10 
          : null;

        return {
          student,
          subjects,
          periodTotals: periodTotalsMap,
          periodCounts,
          yearlyTotal,
          overallAverage,
          period,
          isSemesterReport: false,
          hasIncomplete: hasIncompleteGrades || anySubjectIncomplete,
        };
      }

    },
    enabled: !!studentId && !!period,
  });
};
