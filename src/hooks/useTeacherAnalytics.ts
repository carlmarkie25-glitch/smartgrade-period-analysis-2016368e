import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTeacherAnalytics = (period: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["teacher-analytics", user?.id, period],
    queryFn: async () => {
      if (!user?.id) return { totalStudents: 0, passingStudents: 0, failingStudents: 0, passRate: 0, failRate: 0 };

      // Get teacher's classes (taught + sponsored)
      const { data: classes } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user.id);

      const { data: sponsored } = await supabase
        .from("sponsor_class_assignments")
        .select("class_id")
        .eq("user_id", user.id);

      const classIds = [
        ...(classes?.map(c => c.id) || []),
        ...(sponsored?.map(s => s.class_id) || []),
      ].filter((v, i, a) => a.indexOf(v) === i);

      if (classIds.length === 0) return { totalStudents: 0, passingStudents: 0, failingStudents: 0, passRate: 0, failRate: 0 };

      // Get students in these classes
      const { data: students } = await supabase
        .from("students")
        .select("id")
        .in("class_id", classIds);

      const studentIds = students?.map(s => s.id) || [];
      const totalStudents = studentIds.length;
      if (totalStudents === 0) return { totalStudents: 0, passingStudents: 0, failingStudents: 0, passRate: 0, failRate: 0 };

      // Get grades for these students
      const { data: grades } = await supabase
        .from("student_grades")
        .select("score, max_score, student_id")
        .eq("period", period as any)
        .in("student_id", studentIds);

      const studentScores = new Map<string, { total: number; max: number }>();
      grades?.forEach((g) => {
        const existing = studentScores.get(g.student_id) || { total: 0, max: 0 };
        studentScores.set(g.student_id, {
          total: existing.total + Number(g.score),
          max: existing.max + Number(g.max_score),
        });
      });

      let passingStudents = 0;
      let failingStudents = 0;
      studentScores.forEach((scores) => {
        const pct = (scores.total / scores.max) * 100;
        if (pct >= 50) passingStudents++;
        else failingStudents++;
      });

      return {
        totalStudents,
        passingStudents,
        failingStudents,
        passRate: totalStudents ? Math.round((passingStudents / totalStudents) * 100) : 0,
        failRate: totalStudents ? Math.round((failingStudents / totalStudents) * 100) : 0,
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

      const { data: classes } = await supabase.from("classes").select("id").eq("teacher_id", user.id);
      const { data: sponsored } = await supabase.from("sponsor_class_assignments").select("class_id").eq("user_id", user.id);
      const classIds = [...(classes?.map(c => c.id) || []), ...(sponsored?.map(s => s.class_id) || [])].filter((v, i, a) => a.indexOf(v) === i);
      if (classIds.length === 0) return [];

      const { data: students } = await supabase.from("students").select("id, full_name, class_id, classes(name)").in("class_id", classIds);
      const studentIds = students?.map(s => s.id) || [];
      if (studentIds.length === 0) return [];

      const { data: grades } = await supabase
        .from("student_grades")
        .select("score, max_score, student_id")
        .eq("period", period as any)
        .in("student_id", studentIds);

      const avgMap = new Map<string, { total: number; max: number }>();
      grades?.forEach((g) => {
        const ex = avgMap.get(g.student_id) || { total: 0, max: 0 };
        avgMap.set(g.student_id, { total: ex.total + Number(g.score), max: ex.max + Number(g.max_score) });
      });

      const studentMap = new Map(students?.map(s => [s.id, s]) || []);
      return Array.from(avgMap.entries())
        .map(([id, scores]) => {
          const s = studentMap.get(id) as any;
          return {
            name: s?.full_name || "Unknown",
            class: s?.classes?.name || "N/A",
            average: scores.max > 0 ? Math.round((scores.total / scores.max) * 100) : 0,
          };
        })
        .sort((a, b) => b.average - a.average)
        .slice(0, limit);
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

      const { data: classes } = await supabase.from("classes").select("id").eq("teacher_id", user.id);
      const { data: sponsored } = await supabase.from("sponsor_class_assignments").select("class_id").eq("user_id", user.id);
      const classIds = [...(classes?.map(c => c.id) || []), ...(sponsored?.map(s => s.class_id) || [])].filter((v, i, a) => a.indexOf(v) === i);
      if (classIds.length === 0) return [];

      const { data: students } = await supabase.from("students").select("id, full_name, class_id, classes(name)").in("class_id", classIds);
      const studentIds = students?.map(s => s.id) || [];
      if (studentIds.length === 0) return [];

      const { data: grades } = await supabase
        .from("student_grades")
        .select("score, max_score, student_id, class_subject_id")
        .eq("period", period as any)
        .in("student_id", studentIds);

      const failures = new Map<string, Set<string>>();
      grades?.forEach((g) => {
        const pct = (Number(g.score) / Number(g.max_score)) * 100;
        if (pct < 50) {
          if (!failures.has(g.student_id)) failures.set(g.student_id, new Set());
          failures.get(g.student_id)!.add(g.class_subject_id);
        }
      });

      const studentMap = new Map(students?.map(s => [s.id, s]) || []);
      return Array.from(failures.entries())
        .filter(([_, subs]) => subs.size >= 3)
        .map(([id, subs]) => {
          const s = studentMap.get(id) as any;
          return { name: s?.full_name || "Unknown", class: s?.classes?.name || "N/A", failingSubjects: subs.size };
        })
        .sort((a, b) => b.failingSubjects - a.failingSubjects);
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

      const { data: classes } = await supabase.from("classes").select("id, name").eq("teacher_id", user.id);
      const { data: sponsored } = await supabase.from("sponsor_class_assignments").select("class_id, classes(id, name)").eq("user_id", user.id);

      const classMap = new Map<string, string>();
      classes?.forEach(c => classMap.set(c.id, c.name));
      sponsored?.forEach((s: any) => { if (s.classes) classMap.set(s.classes.id, s.classes.name); });

      const classIds = Array.from(classMap.keys());
      if (classIds.length === 0) return [];

      const { data: students } = await supabase.from("students").select("id, class_id").in("class_id", classIds);
      const studentIds = students?.map(s => s.id) || [];
      if (studentIds.length === 0) return [];

      const studentClassMap = new Map(students?.map(s => [s.id, s.class_id]) || []);

      const { data: grades } = await supabase
        .from("student_grades")
        .select("score, max_score, student_id")
        .eq("period", period as any)
        .in("student_id", studentIds);

      const classScores = new Map<string, { total: number; max: number }>();
      grades?.forEach((g) => {
        const cId = studentClassMap.get(g.student_id);
        if (!cId) return;
        const ex = classScores.get(cId) || { total: 0, max: 0 };
        classScores.set(cId, { total: ex.total + Number(g.score), max: ex.max + Number(g.max_score) });
      });

      return Array.from(classScores.entries())
        .map(([id, s]) => ({
          className: classMap.get(id) || "Unknown",
          average: s.max > 0 ? (s.total / s.max) * 100 : 0,
        }))
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

      const { data: classes } = await supabase.from("classes").select("id").eq("teacher_id", user.id);
      const { data: sponsored } = await supabase.from("sponsor_class_assignments").select("class_id").eq("user_id", user.id);
      const classIds = [...(classes?.map(c => c.id) || []), ...(sponsored?.map(s => s.class_id) || [])].filter((v, i, a) => a.indexOf(v) === i);
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
          .in("student_id", studentIds);

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
