import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper: determines which students have complete grades for a given period.
 * A student is "complete" when they have a non-null score for every
 * (class_subject, assessment_type) combination relevant to their class/department.
 */
const getCompleteStudentScores = async (period: string, studentFilter?: string[]) => {
  // 1. Fetch all students (optionally filtered)
  let studentsQuery = supabase.from("students").select("id, full_name, class_id, department_id, classes(name)");
  if (studentFilter) {
    studentsQuery = studentsQuery.in("id", studentFilter);
  }
  const { data: students } = await studentsQuery;
  if (!students || students.length === 0) return { completeStudents: [], allStudents: students || [] };

  // 2. Get class_subjects for the classes these students belong to
  const classIds = [...new Set(students.map(s => s.class_id))];
  const { data: classSubjects } = await supabase
    .from("class_subjects")
    .select("id, class_id")
    .in("class_id", classIds);

  // 3. Get assessment_types (filtered by department where applicable)
  const deptIds = [...new Set(students.map(s => s.department_id))];
  const { data: assessmentTypes } = await supabase
    .from("assessment_types")
    .select("id, department_id");

  if (!classSubjects || classSubjects.length === 0 || !assessmentTypes || assessmentTypes.length === 0) {
    return { completeStudents: [], allStudents: students };
  }

  // 4. Build expected grade count per student
  // For each student: count of (class_subjects in their class) × (assessment_types for their dept or null dept)
  const classSubjectsByClass = new Map<string, string[]>();
  classSubjects.forEach(cs => {
    const list = classSubjectsByClass.get(cs.class_id) || [];
    list.push(cs.id);
    classSubjectsByClass.set(cs.class_id, list);
  });

  const assessmentsByDept = new Map<string, string[]>();
  assessmentTypes.forEach(at => {
    // assessment_type with null department applies to all
    const key = at.department_id || "__all__";
    const list = assessmentsByDept.get(key) || [];
    list.push(at.id);
    assessmentsByDept.set(key, list);
  });

  const getExpectedCount = (classId: string, deptId: string) => {
    const subjects = classSubjectsByClass.get(classId) || [];
    const deptAssessments = assessmentsByDept.get(deptId) || [];
    const globalAssessments = assessmentsByDept.get("__all__") || [];
    const allAssessments = [...deptAssessments, ...globalAssessments];
    return subjects.length * allAssessments.length;
  };

  // 5. Fetch actual grades for this period
  const studentIds = students.map(s => s.id);
  const { data: grades } = await supabase
    .from("student_grades")
    .select("score, max_score, student_id, class_subject_id, assessment_type_id")
    .eq("period", period as any)
    .in("student_id", studentIds);

  // 6. Count actual non-null grades per student
  const actualCounts = new Map<string, number>();
  const studentScores = new Map<string, { total: number; max: number }>();

  grades?.forEach(g => {
    if (g.score !== null) {
      actualCounts.set(g.student_id, (actualCounts.get(g.student_id) || 0) + 1);
      const ex = studentScores.get(g.student_id) || { total: 0, max: 0 };
      studentScores.set(g.student_id, {
        total: ex.total + Number(g.score),
        max: ex.max + Number(g.max_score),
      });
    }
  });

  // 7. Filter to only complete students
  const completeStudents: Array<{
    id: string;
    name: string;
    class: string;
    total: number;
    max: number;
    average: number;
  }> = [];

  students.forEach((s: any) => {
    const expected = getExpectedCount(s.class_id, s.department_id);
    const actual = actualCounts.get(s.id) || 0;
    if (expected > 0 && actual >= expected) {
      const scores = studentScores.get(s.id) || { total: 0, max: 0 };
      const average = scores.max > 0 ? Math.round((scores.total / scores.max) * 100) : 0;
      completeStudents.push({
        id: s.id,
        name: s.full_name,
        class: s.classes?.name || "N/A",
        total: scores.total,
        max: scores.max,
        average,
      });
    }
  });

  return { completeStudents, allStudents: students };
};

export const useAnalytics = (period: string) => {
  return useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => {
      const { completeStudents, allStudents } = await getCompleteStudentScores(period);
      const totalStudents = allStudents.length;
      const gradedStudents = completeStudents.length;

      let passingStudents = 0;
      let failingStudents = 0;

      completeStudents.forEach(s => {
        if (s.average > 60) passingStudents++;
        else failingStudents++;
      });

      const passRate = gradedStudents ? Math.round((passingStudents / gradedStudents) * 100) : 0;
      const failRate = gradedStudents ? Math.round((failingStudents / gradedStudents) * 100) : 0;

      const allGraded = totalStudents > 0 && gradedStudents === totalStudents;
      return { totalStudents, passingStudents, failingStudents, passRate, failRate, allGraded, gradedStudents };
    },
  });
};

export const useTopStudents = (period: string, limit: number = 5) => {
  return useQuery({
    queryKey: ["top-students", period, limit],
    queryFn: async () => {
      const { completeStudents } = await getCompleteStudentScores(period);

      return completeStudents
        .filter(s => s.average >= 90)
        .sort((a, b) => b.average - a.average)
        .slice(0, limit)
        .map(s => ({ name: s.name, class: s.class, average: s.average }));
    },
  });
};

export const useAtRiskStudents = (period: string) => {
  return useQuery({
    queryKey: ["at-risk-students", period],
    queryFn: async () => {
      const { completeStudents } = await getCompleteStudentScores(period);

      return completeStudents
        .filter(s => s.average <= 75)
        .sort((a, b) => a.average - b.average)
        .map(s => ({ name: s.name, class: s.class, average: s.average, failingSubjects: 0 }));
    },
  });
};

export const useClassPerformance = (period: string) => {
  return useQuery({
    queryKey: ["class-performance", period],
    queryFn: async () => {
      const { data: grades, error } = await supabase
        .from("student_grades")
        .select(`score, max_score, students ( classes ( id, name ) )`)
        .eq("period", period as any)
        .not("score", "is", null);
      if (error) throw error;

      const classScores = new Map<string, { name: string; total: number; max: number }>();
      grades?.forEach((grade: any) => {
        const classId = grade.students?.classes?.id;
        const className = grade.students?.classes?.name;
        if (classId && className) {
          const existing = classScores.get(classId);
          if (existing) {
            existing.total += Number(grade.score) || 0;
            existing.max += Number(grade.max_score) || 0;
          } else {
            classScores.set(classId, { name: className, total: Number(grade.score) || 0, max: Number(grade.max_score) || 0 });
          }
        }
      });

      return Array.from(classScores.values())
        .map(cls => ({ className: cls.name, average: cls.max > 0 ? (cls.total / cls.max) * 100 : 0 }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 10);
    },
  });
};

export const usePerformanceTrend = () => {
  return useQuery({
    queryKey: ["performance-trend"],
    queryFn: async () => {
      const periods = ["p1", "p2", "p3", "p4", "p5", "p6"] as const;
      const trendData: { period: string; average: number }[] = [];

      for (const period of periods) {
        const { data: grades, error } = await supabase
          .from("student_grades")
          .select("score, max_score")
          .eq("period", period)
          .not("score", "is", null);
        if (error) continue;
        if (grades && grades.length > 0) {
          const totalScore = grades.reduce((sum, g) => sum + (Number(g.score) || 0), 0);
          const totalMax = grades.reduce((sum, g) => sum + (Number(g.max_score) || 0), 0);
          const average = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
          trendData.push({ period: `Period ${period.replace("p", "")}`, average: Math.floor(average * 10) / 10 });
        }
      }
      return trendData;
    },
  });
};
