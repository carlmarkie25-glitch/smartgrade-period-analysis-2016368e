import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAnalytics = (period: string) => {
  return useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => {
      // Get all students
      const { count: totalStudents, error: studentsError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (studentsError) throw studentsError;

      // Get grades for the selected period
      const { data: grades, error: gradesError } = await supabase
        .from("student_grades")
        .select(`
          score,
          max_score,
          student_id
        `)
        .eq("period", period as any);

      if (gradesError) throw gradesError;

      // Calculate pass/fail statistics
      const studentScores = new Map<string, { total: number; max: number; count: number }>();
      
      grades?.forEach((grade) => {
        const existing = studentScores.get(grade.student_id) || { total: 0, max: 0, count: 0 };
        studentScores.set(grade.student_id, {
          total: existing.total + Number(grade.score),
          max: existing.max + Number(grade.max_score),
          count: existing.count + 1,
        });
      });

      let passingStudents = 0;
      let failingStudents = 0;

      studentScores.forEach((scores) => {
        const percentage = (scores.total / scores.max) * 100;
        if (percentage >= 50) {
          passingStudents++;
        } else {
          failingStudents++;
        }
      });

      const passRate = totalStudents ? Math.round((passingStudents / totalStudents) * 100) : 0;
      const failRate = totalStudents ? Math.round((failingStudents / totalStudents) * 100) : 0;

      return {
        totalStudents: totalStudents || 0,
        passingStudents,
        failingStudents,
        passRate,
        failRate,
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
          score,
          max_score,
          student_id,
          students (
            id,
            full_name,
            classes (
              name
            )
          )
        `)
        .eq("period", period as any);

      if (error) throw error;

      // Calculate average for each student
      const studentAverages = new Map<string, { 
        name: string; 
        class: string; 
        total: number; 
        max: number; 
      }>();

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

      // Convert to array and calculate percentages
      const studentsWithAverages = Array.from(studentAverages.values())
        .map((student) => ({
          name: student.name,
          class: student.class,
          average: Math.round((student.total / student.max) * 100),
        }))
        .sort((a, b) => b.average - a.average)
        .slice(0, limit);

      return studentsWithAverages;
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
          score,
          max_score,
          student_id,
          class_subject_id,
          students (
            id,
            full_name,
            classes (
              name
            )
          )
        `)
        .eq("period", period as any);

      if (error) throw error;

      // Track failing subjects per student
      const studentFailures = new Map<string, {
        name: string;
        class: string;
        failingSubjects: Set<string>;
      }>();

      grades?.forEach((grade: any) => {
        const percentage = (Number(grade.score) / Number(grade.max_score)) * 100;
        
        if (percentage < 50) {
          const studentId = grade.student_id;
          const existing = studentFailures.get(studentId);
          
          if (existing) {
            existing.failingSubjects.add(grade.class_subject_id);
          } else {
            studentFailures.set(studentId, {
              name: grade.students.full_name,
              class: grade.students.classes?.name || "N/A",
              failingSubjects: new Set([grade.class_subject_id]),
            });
          }
        }
      });

      // Filter students with 3 or more failing subjects
      const atRiskStudents = Array.from(studentFailures.values())
        .filter((student) => student.failingSubjects.size >= 3)
        .map((student) => ({
          name: student.name,
          class: student.class,
          failingSubjects: student.failingSubjects.size,
        }))
        .sort((a, b) => b.failingSubjects - a.failingSubjects);

      return atRiskStudents;
    },
  });
};

export const useClassPerformance = (period: string) => {
  return useQuery({
    queryKey: ["class-performance", period],
    queryFn: async () => {
      const { data: grades, error } = await supabase
        .from("student_grades")
        .select(`
          score,
          max_score,
          students (
            classes (
              id,
              name
            )
          )
        `)
        .eq("period", period as any);

      if (error) throw error;

      // Calculate average per class
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
            classScores.set(classId, {
              name: className,
              total: Number(grade.score) || 0,
              max: Number(grade.max_score) || 0,
            });
          }
        }
      });

      const classPerformance = Array.from(classScores.values())
        .map((cls) => ({
          className: cls.name,
          average: cls.max > 0 ? (cls.total / cls.max) * 100 : 0,
        }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 10);

      return classPerformance;
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

          trendData.push({
            period: `Period ${period.replace("p", "")}`,
            average: Math.floor(average * 10) / 10,
          });
        }
      }

      return trendData;
    },
  });
};
