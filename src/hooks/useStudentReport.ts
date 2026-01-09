import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Helper function to check if a score is missing (null/undefined)
const isMissingScore = (score: number | null | undefined): boolean => {
  return score === null || score === undefined;
};

// A subject-period is incomplete if any assessment is missing OR the overall percentage is below 60
const isAggregateIncomplete = (
  totalScore: number,
  totalMax: number,
  hasMissing: boolean
): boolean => {
  if (hasMissing) return true;
  if (!totalMax || totalMax <= 0) return true;
  return (totalScore / totalMax) * 100 < 60;
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

      // Check if student has any missing grades
      const hasMissingGrades = grades?.some((grade: any) => isMissingScore(grade.score)) || false;

      // Get period ranks from the new RPC (computes overall class rank for each period)
      const { data: periodRanks, error: periodRanksError } = await supabase
        .rpc("get_student_period_ranks", {
          p_student_id: studentId,
          p_periods: periodsToFetch,
        });

      if (periodRanksError) throw periodRanksError;

      // Build periodTotalsMap and periodCounts from the RPC result
      const periodTotalsMap = new Map<string, { class_rank: number | null; total_score: number; is_incomplete: boolean }>();
      const periodCounts: Record<string, number> = {};

      if (periodRanks) {
        for (const row of periodRanks) {
          periodTotalsMap.set(row.period, {
            class_rank: row.class_rank,
            total_score: row.total_score,
            is_incomplete: row.is_incomplete,
          });
          periodCounts[row.period] = row.total_students;
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

      // periodTotalsMap was already built above; this is a placeholder for clarity
      // const periodTotalsMap was built from RPC results

      // Check if this is a semester report
      const isSemesterReport = period === 'semester1' || period === 'semester2' || period === 'yearly';

      if (isSemesterReport) {
        // For semester reports, organize by subject and period
        const subjectGrades = new Map<string, {
          name: string;
          code: string;
          periods: { [key: string]: { score: number; max: number; hasMissing: boolean } };
        }>();

        grades?.forEach((grade: any) => {
          const subjectName = grade.class_subjects?.subjects?.name || "Unknown";
          const subjectCode = grade.class_subjects?.subjects?.code || "N/A";
          const gradePeriod = grade.period;
          const scoreValue: number | null = grade.score;
          const isMissing = isMissingScore(scoreValue);

          const existing = subjectGrades.get(subjectName);

          if (existing) {
            if (!existing.periods[gradePeriod]) {
              existing.periods[gradePeriod] = { score: 0, max: 0, hasMissing: false };
            }
            existing.periods[gradePeriod].score += scoreValue ?? 0;
            existing.periods[gradePeriod].max += Number(grade.max_score);
            existing.periods[gradePeriod].hasMissing =
              existing.periods[gradePeriod].hasMissing || isMissing;
          } else {
            subjectGrades.set(subjectName, {
              name: subjectName,
              code: subjectCode,
              periods: {
                [gradePeriod]: {
                  score: scoreValue ?? 0,
                  max: Number(grade.max_score),
                  hasMissing: isMissing,
                },
              },
            });
          }
        });

        // Convert to array and compute incomplete status per subject-period
        const subjects = Array.from(subjectGrades.values()).map((subject) => {
          const periodData: any = {};
          let semesterTotal = 0;
          let semesterMax = 0;
          let hasAnyIncomplete = false;

          Object.keys(subject.periods).forEach((p) => {
            const pData = subject.periods[p];
            const percentage =
              pData.max > 0 ? Math.floor((pData.score / pData.max) * 1000) / 10 : 0;

            const isIncomplete = isAggregateIncomplete(pData.score, pData.max, pData.hasMissing);

            periodData[p] = {
              ...pData,
              // When incomplete, hide the numeric value (show "I" in UI)
              score: isIncomplete ? null : pData.score,
              isIncomplete,
              percentage,
            };

            semesterTotal += pData.score;
            semesterMax += pData.max;
            if (isIncomplete) hasAnyIncomplete = true;
          });

          // Only calculate semester average if all required periods exist and none are incomplete
          const subjectHasAllPeriods = periodsToFetch.every((p) => subject.periods[p]);
          const subjectIsIncomplete = hasAnyIncomplete || !subjectHasAllPeriods;

          const semesterAverage =
            subjectHasAllPeriods && semesterMax > 0 && !subjectIsIncomplete
              ? Math.floor((semesterTotal / semesterMax) * 1000) / 10
              : null;

          return {
            ...subject,
            periods: periodData,
            semesterAverage,
            hasIncomplete: subjectIsIncomplete,
          };
        });

        // Check if any subject has incomplete grades
        const anySubjectIncomplete = subjects.some((s) => s.hasIncomplete);

        // Calculate overall average only if all subjects have their semester averages and no incomplete grades
        const subjectsWithAverages = subjects.filter((s) => s.semesterAverage !== null);
        const overallTotal = subjectsWithAverages.reduce(
          (sum, s) => sum + (s.semesterAverage || 0),
          0
        );
        const overallAverage =
          subjectsWithAverages.length > 0 &&
          subjectsWithAverages.length === subjects.length &&
          !anySubjectIncomplete
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
          hasIncomplete: hasMissingGrades || anySubjectIncomplete,
        };
      } else {
        // Original logic for individual period reports
        const subjectGrades = new Map<
          string,
          {
            name: string;
            code: string;
            total: number;
            max: number;
            hasMissing: boolean;
            assessments: Array<{
              type: string;
              score: number | null;
              max: number;
              isIncomplete: boolean;
            }>;
          }
        >();

        grades?.forEach((grade: any) => {
          const subjectName = grade.class_subjects?.subjects?.name || "Unknown";
          const subjectCode = grade.class_subjects?.subjects?.code || "N/A";
          const scoreValue: number | null = grade.score;
          const isMissing = isMissingScore(scoreValue);

          const existing = subjectGrades.get(subjectName);
          const assessment = {
            type: grade.assessment_types?.name || "Assessment",
            score: scoreValue,
            max: Number(grade.max_score),
            // For a single assessment entry, only "missing" counts as incomplete.
            // The subject-period completeness is decided from the aggregate.
            isIncomplete: isMissing,
          };

          if (existing) {
            existing.total += scoreValue ?? 0;
            existing.max += Number(grade.max_score);
            existing.hasMissing = existing.hasMissing || isMissing;
            existing.assessments.push(assessment);
          } else {
            subjectGrades.set(subjectName, {
              name: subjectName,
              code: subjectCode,
              total: scoreValue ?? 0,
              max: Number(grade.max_score),
              hasMissing: isMissing,
              assessments: [assessment],
            });
          }
        });

        // Convert to array and compute incomplete status from the aggregate
        const subjects = Array.from(subjectGrades.values()).map((s) => {
          const isIncomplete = isAggregateIncomplete(s.total, s.max, s.hasMissing);
          return {
            ...s,
            hasIncomplete: isIncomplete,
          };
        });

        // Check if any subject has incomplete grades
        const anySubjectIncomplete = subjects.some((s) => s.hasIncomplete);

        // Calculate overall average only if no incomplete grades (truncate to 1 decimal)
        const overallTotal = subjects.reduce((sum, s) => sum + s.total, 0);
        const overallMax = subjects.reduce((sum, s) => sum + s.max, 0);
        const overallAverage =
          overallMax > 0 && !hasMissingGrades && !anySubjectIncomplete
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
          hasIncomplete: hasMissingGrades || anySubjectIncomplete,
        };
      }

    },
    enabled: !!studentId && !!period,
  });
};
