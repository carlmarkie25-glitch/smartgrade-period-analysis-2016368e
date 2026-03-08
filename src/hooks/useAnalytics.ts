import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudentClassification {
  name: string;
  class: string;
  average: number;
  category: "needing_attention" | "at_risk" | "failed";
}

export const useAnalytics = (period: string) => {
  return useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => {
      const { count: totalStudents, error: studentsError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });
      if (studentsError) throw studentsError;

      const { data: grades, error: gradesError } = await supabase
        .from("student_grades")
        .select("score, max_score, student_id")
        .eq("period", period as any);
      if (gradesError) throw gradesError;

      const studentScores = new Map<string, { total: number; max: number }>();
      grades?.forEach((grade) => {
        const existing = studentScores.get(grade.student_id) || { total: 0, max: 0 };
        studentScores.set(grade.student_id, {
          total: existing.total + Number(grade.score),
          max: existing.max + Number(grade.max_score),
        });
      });

      let passingStudents = 0;
      let failingStudents = 0;
      let needingAttentionCount = 0;
      let atRiskCount = 0;
      let failedCount = 0;

      studentScores.forEach((scores) => {
        const pct = scores.max > 0 ? (scores.total / scores.max) * 100 : 0;
        if (pct > 60) passingStudents++;
        else failingStudents++;

        if (pct <= 75 && pct > 72) needingAttentionCount++;
        if (pct <= 72 && pct > 60) atRiskCount++;
        if (pct <= 60) failedCount++;
      });

      const passRate = totalStudents ? Math.round((passingStudents / totalStudents) * 100) : 0;
      const failRate = totalStudents ? Math.round((failingStudents / totalStudents) * 100) : 0;

      return {
        totalStudents: totalStudents || 0,
        passingStudents,
        failingStudents,
        passRate,
        failRate,
        needingAttentionCount,
        atRiskCount,
        failedCount,
      };
    },
  });
};

export const useTopStudents = (period: string, limit: number = 5) => {
  return useQuery({
    queryKey: ["top-students", period, limit],
    queryFn: async () => {
      const { data: grades, error } = await supabase
        .from("student_grades")
        .select(`
          score, max_score, student_id,
          students ( id, full_name, classes ( name ) )
        `)
        .eq("period", period as any);
      if (error) throw error;

      const studentAverages = new Map<string, { name: string; class: string; total: number; max: number }>();
      grades?.forEach((grade: any) => {
        const studentId = grade.student_id;
        const existing = studentAverages.get(studentId);
        if (existing) {
          existing.total += Number(grade.score);
          existing.max += Number(grade.max_score);
        } else {
          studentAverages.set(studentId, {
            name: grade.students.full_name,
            class: grade.students.classes?.name || "N/A",
            total: Number(grade.score),
            max: Number(grade.max_score),
          });
        }
      });

      return Array.from(studentAverages.values())
        .map((s) => ({
          name: s.name,
          class: s.class,
          average: s.max > 0 ? Math.round((s.total / s.max) * 100) : 0,
        }))
        .filter((s) => s.average >= 90)
        .sort((a, b) => b.average - a.average)
        .slice(0, limit);
    },
  });
};

export const useClassifiedStudents = (period: string) => {
  return useQuery({
    queryKey: ["classified-students", period],
    queryFn: async () => {
      const { data: grades, error } = await supabase
        .from("student_grades")
        .select(`
          score, max_score, student_id,
          students ( id, full_name, classes ( name ) )
        `)
        .eq("period", period as any);
      if (error) throw error;

      const studentAverages = new Map<string, { name: string; class: string; total: number; max: number }>();
      grades?.forEach((grade: any) => {
        const existing = studentAverages.get(grade.student_id);
        if (existing) {
          existing.total += Number(grade.score);
          existing.max += Number(grade.max_score);
        } else {
          studentAverages.set(grade.student_id, {
            name: grade.students.full_name,
            class: grade.students.classes?.name || "N/A",
            total: Number(grade.score),
            max: Number(grade.max_score),
          });
        }
      });

      const needingAttention: StudentClassification[] = [];
      const atRisk: StudentClassification[] = [];
      const failed: StudentClassification[] = [];

      studentAverages.forEach((s) => {
        const avg = s.max > 0 ? Math.round((s.total / s.max) * 100) : 0;
        const entry = { name: s.name, class: s.class, average: avg };

        if (avg <= 60) {
          failed.push({ ...entry, category: "failed" });
        } else if (avg <= 72) {
          atRisk.push({ ...entry, category: "at_risk" });
        } else if (avg <= 75) {
          needingAttention.push({ ...entry, category: "needing_attention" });
        }
      });

      needingAttention.sort((a, b) => a.average - b.average);
      atRisk.sort((a, b) => a.average - b.average);
      failed.sort((a, b) => a.average - b.average);

      return { needingAttention, atRisk, failed };
    },
  });
};

export const useAtRiskStudents = (period: string) => {
  return useQuery({
    queryKey: ["at-risk-students", period],
    queryFn: async () => {
      const { data: grades, error } = await supabase
        .from("student_grades")
        .select(`
          score, max_score, student_id,
          students ( id, full_name, classes ( name ) )
        `)
        .eq("period", period as any);
      if (error) throw error;

      const studentAverages = new Map<string, { name: string; class: string; total: number; max: number }>();
      grades?.forEach((grade: any) => {
        const existing = studentAverages.get(grade.student_id);
        if (existing) {
          existing.total += Number(grade.score);
          existing.max += Number(grade.max_score);
        } else {
          studentAverages.set(grade.student_id, {
            name: grade.students.full_name,
            class: grade.students.classes?.name || "N/A",
            total: Number(grade.score),
            max: Number(grade.max_score),
          });
        }
      });

      return Array.from(studentAverages.values())
        .map((s) => ({
          name: s.name,
          class: s.class,
          average: s.max > 0 ? Math.round((s.total / s.max) * 100) : 0,
          failingSubjects: 0,
        }))
        .filter((s) => s.average <= 72)
        .sort((a, b) => a.average - b.average);
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
        .eq("period", period as any);
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
        .map((cls) => ({ className: cls.name, average: cls.max > 0 ? (cls.total / cls.max) * 100 : 0 }))
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
          .eq("period", period);
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
