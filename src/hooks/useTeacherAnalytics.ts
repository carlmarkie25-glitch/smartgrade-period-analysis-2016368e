import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const getTeacherClassIds = async (userId: string) => {
  const { data: classes } = await supabase.from("classes").select("id").eq("teacher_id", userId);
  const { data: sponsored } = await supabase.from("sponsor_class_assignments").select("class_id").eq("user_id", userId);
  return [...(classes?.map(c => c.id) || []), ...(sponsored?.map(s => s.class_id) || [])].filter((v, i, a) => a.indexOf(v) === i);
};

/**
 * Gets students with complete grades only.
 * A student is complete when they have a non-null score for every
 * (class_subject × assessment_type) combination for the period.
 */
const getCompleteTeacherStudents = async (userId: string, period: string) => {
  const classIds = await getTeacherClassIds(userId);
  if (classIds.length === 0) return { completeStudents: [], allStudents: [], classIds };

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, class_id, department_id, classes(name)")
    .in("class_id", classIds);
  if (!students || students.length === 0) return { completeStudents: [], allStudents: [], classIds };

  const { data: classSubjects } = await supabase
    .from("class_subjects")
    .select("id, class_id")
    .in("class_id", classIds);

  const deptIds = [...new Set(students.map(s => s.department_id))];
  const { data: assessmentTypes } = await supabase
    .from("assessment_types")
    .select("id, department_id");

  if (!classSubjects || classSubjects.length === 0 || !assessmentTypes || assessmentTypes.length === 0) {
    return { completeStudents: [], allStudents: students, classIds };
  }

  const classSubjectsByClass = new Map<string, string[]>();
  classSubjects.forEach(cs => {
    const list = classSubjectsByClass.get(cs.class_id) || [];
    list.push(cs.id);
    classSubjectsByClass.set(cs.class_id, list);
  });

  const assessmentsByDept = new Map<string, string[]>();
  assessmentTypes.forEach(at => {
    const key = at.department_id || "__all__";
    const list = assessmentsByDept.get(key) || [];
    list.push(at.id);
    assessmentsByDept.set(key, list);
  });

  const getExpectedCount = (classId: string, deptId: string) => {
    const subjects = classSubjectsByClass.get(classId) || [];
    const deptAssessments = assessmentsByDept.get(deptId) || [];
    const globalAssessments = assessmentsByDept.get("__all__") || [];
    return subjects.length * (deptAssessments.length + globalAssessments.length);
  };

  const studentIds = students.map(s => s.id);
  const { data: grades } = await supabase
    .from("student_grades")
    .select("score, max_score, student_id")
    .eq("period", period as any)
    .in("student_id", studentIds);

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

  const completeStudents: Array<{
    id: string; name: string; class: string;
    total: number; max: number; average: number;
  }> = [];

  students.forEach((s: any) => {
    const expected = getExpectedCount(s.class_id, s.department_id);
    const actual = actualCounts.get(s.id) || 0;
    if (expected > 0 && actual >= expected) {
      const scores = studentScores.get(s.id) || { total: 0, max: 0 };
      const average = scores.max > 0 ? Math.round((scores.total / scores.max) * 100) : 0;
      completeStudents.push({
        id: s.id, name: s.full_name, class: s.classes?.name || "N/A",
        total: scores.total, max: scores.max, average,
      });
    }
  });

  return { completeStudents, allStudents: students, classIds };
};

export const useTeacherAnalytics = (period: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teacher-analytics", user?.id, period],
    queryFn: async () => {
      const empty = { totalStudents: 0, passingStudents: 0, failingStudents: 0, passRate: 0, failRate: 0, needingAttentionCount: 0, atRiskCount: 0, failedCount: 0, allGraded: false, gradedStudents: 0 };
      if (!user?.id) return empty;

      const { completeStudents, allStudents } = await getCompleteTeacherStudents(user.id, period);
      const totalStudents = allStudents.length;
      const gradedStudents = completeStudents.length;

      let passingStudents = 0, failingStudents = 0, needingAttentionCount = 0, atRiskCount = 0, failedCount = 0;
      completeStudents.forEach(s => {
        if (s.average > 60) passingStudents++; else failingStudents++;
        if (s.average <= 75 && s.average > 72) needingAttentionCount++;
        if (s.average <= 72 && s.average > 60) atRiskCount++;
        if (s.average <= 60) failedCount++;
      });

      const allGraded = totalStudents > 0 && gradedStudents === totalStudents;
      return {
        totalStudents, passingStudents, failingStudents,
        passRate: gradedStudents ? Math.round((passingStudents / gradedStudents) * 100) : 0,
        failRate: gradedStudents ? Math.round((failingStudents / gradedStudents) * 100) : 0,
        needingAttentionCount, atRiskCount, failedCount, allGraded, gradedStudents,
      };
    },
    enabled: !!user?.id,
  });
};

export const useTeacherTopStudents = (period: string, limit = 5) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teacher-top-students", user?.id, period, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      const { completeStudents } = await getCompleteTeacherStudents(user.id, period);
      return completeStudents
        .filter(s => s.average >= 90)
        .sort((a, b) => b.average - a.average)
        .slice(0, limit)
        .map(s => ({ name: s.name, class: s.class, average: s.average }));
    },
    enabled: !!user?.id,
  });
};

export const useTeacherAtRiskStudents = (period: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teacher-at-risk", user?.id, period],
    queryFn: async () => {
      if (!user?.id) return [];
      const { completeStudents } = await getCompleteTeacherStudents(user.id, period);
      return completeStudents
        .filter(s => s.average <= 75)
        .sort((a, b) => a.average - b.average)
        .map(s => ({ name: s.name, class: s.class, average: s.average, failingSubjects: 0 }));
    },
    enabled: !!user?.id,
  });
};

export const useTeacherClassPerformance = (period: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teacher-class-performance", user?.id, period],
    queryFn: async () => {
      if (!user?.id) return [];
      const classIds = await getTeacherClassIds(user.id);
      if (classIds.length === 0) return [];

      const { data: classes } = await supabase.from("classes").select("id, name").in("id", classIds);
      const classMap = new Map(classes?.map(c => [c.id, c.name]) || []);

      const { data: students } = await supabase.from("students").select("id, class_id").in("class_id", classIds);
      const studentIds = students?.map(s => s.id) || [];
      if (studentIds.length === 0) return [];

      const studentClassMap = new Map(students?.map(s => [s.id, s.class_id]) || []);
      const { data: grades } = await supabase
        .from("student_grades")
        .select("score, max_score, student_id")
        .eq("period", period as any)
        .in("student_id", studentIds)
        .not("score", "is", null);

      const classScores = new Map<string, { total: number; max: number }>();
      grades?.forEach(g => {
        const cId = studentClassMap.get(g.student_id);
        if (!cId) return;
        const ex = classScores.get(cId) || { total: 0, max: 0 };
        classScores.set(cId, { total: ex.total + Number(g.score as any), max: ex.max + Number(g.max_score as any) });
      });

      return Array.from(classScores.entries())
        .map(([id, s]) => ({ className: classMap.get(id) || "Unknown", average: s.max > 0 ? (s.total / s.max) * 100 : 0 }))
        .sort((a, b) => b.average - a.average);
    },
    enabled: !!user?.id,
  });
};

export const useTeacherPerformanceTrend = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teacher-performance-trend", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const classIds = await getTeacherClassIds(user.id);
      if (classIds.length === 0) return [];
      const { data: students } = await supabase.from("students").select("id").in("class_id", classIds);
      const studentIds = students?.map(s => s.id) || [];
      if (studentIds.length === 0) return [];

      const periods = ["p1", "p2", "p3", "p4", "p5", "p6"] as const;
      const trendData: { period: string; average: number }[] = [];

      for (const period of periods) {
        const { data: grades } = await supabase
          .from("student_grades")
          .select("score, max_score")
          .eq("period", period)
          .in("student_id", studentIds)
          .not("score", "is", null);
        if (grades && grades.length > 0) {
          const totalScore = grades.reduce((sum, g) => sum + (Number(g.score) || 0), 0);
          const totalMax = grades.reduce((sum, g) => sum + (Number(g.max_score) || 0), 0);
          const average = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
          trendData.push({ period: `Period ${period.replace("p", "")}`, average: Math.floor(average * 10) / 10 });
        }
      }
      return trendData;
    },
    enabled: !!user?.id,
  });
};
