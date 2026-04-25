import AppShell from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Award, AlertTriangle, Users, Target, ClipboardList, UserCheck, Globe, Church, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAnalytics, useTopStudents, useAtRiskStudents, useClassPerformance, usePerformanceTrend } from "@/hooks/useAnalytics";
import { useTeacherAnalytics, useTeacherTopStudents, useTeacherAtRiskStudents, useTeacherClassPerformance, useTeacherPerformanceTrend } from "@/hooks/useTeacherAnalytics";
import { useStudentDemographics } from "@/hooks/useStudentDemographics";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useState, useMemo } from "react";
import SubjectTrendsChart from "@/components/analytics/SubjectTrendsChart";
import ClassPerformanceChart from "@/components/analytics/ClassPerformanceChart";
import DemographicsChart from "@/components/analytics/DemographicsChart";
import PassFailChart from "@/components/analytics/PassFailChart";

const Analytics = () => {
  const { isAdmin, isTeacher } = useUserRoles();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  // Determine active period
  const currentActivePeriod = useMemo(() => {
    const month = new Date().getMonth();
    if (month >= 8 && month <= 10) return "p1";
    if (month >= 11 || month === 0) return "p2";
    if (month >= 1 && month <= 2) return "p3";
    if (month >= 3 && month <= 4) return "p4";
    if (month >= 5 && month <= 6) return "p5";
    return "p1";
  }, []);

  const activePeriod = selectedPeriod || currentActivePeriod;

  // Hooks for Admin
  const { data: adminAnalytics, isLoading: adminAnalyticsLoading } = useAnalytics(activePeriod);
  const { data: adminTopStudents = [], isLoading: adminTopLoading } = useTopStudents(activePeriod);
  const { data: adminAtRisk = [], isLoading: adminAtRiskLoading } = useAtRiskStudents(activePeriod);
  const { data: adminClassPerf = [], isLoading: adminClassLoading } = useClassPerformance(activePeriod);
  const { data: adminTrend = [], isLoading: adminTrendLoading } = usePerformanceTrend();

  // Hooks for Teacher
  const { data: teacherAnalytics, isLoading: teacherAnalyticsLoading } = useTeacherAnalytics(activePeriod);
  const { data: teacherTopStudents = [], isLoading: teacherTopLoading } = useTeacherTopStudents(activePeriod);
  const { data: teacherAtRisk = [], isLoading: teacherAtRiskLoading } = useTeacherAtRiskStudents(activePeriod);
  const { data: teacherClassPerf = [], isLoading: teacherClassLoading } = useTeacherClassPerformance(activePeriod);
  const { data: teacherTrend = [], isLoading: teacherTrendLoading } = useTeacherPerformanceTrend();

  const { data: demographics, isLoading: demographicsLoading } = useStudentDemographics();

  const analytics = isAdmin ? adminAnalytics : teacherAnalytics;
  const analyticsLoading = isAdmin ? adminAnalyticsLoading : teacherAnalyticsLoading;
  
  const topStudents = isAdmin ? adminTopStudents : teacherTopStudents;
  const topStudentsLoading = isAdmin ? adminTopLoading : teacherTopLoading;
  
  const atRiskStudents = isAdmin ? adminAtRisk : teacherAtRisk;
  const atRiskLoading = isAdmin ? adminAtRiskLoading : teacherAtRiskLoading;

  const classPerf = isAdmin ? adminClassPerf : teacherClassPerf;
  const classPerfLoading = isAdmin ? adminClassLoading : teacherClassLoading;

  const trendData = isAdmin ? adminTrend : teacherTrend;
  const trendLoading = isAdmin ? adminTrendLoading : teacherTrendLoading;

  const renderStatCard = (stat: { title: string; value: string | number; icon: any; color: string; bg: string; subtitle: string }) => {
    const Icon = stat.icon;
    return (
      <div 
        key={stat.title}
        className="glass-panel p-8 flex flex-col justify-between min-h-[140px] transition-all hover:bg-white/10 group shadow-none"
      >
        <div className="flex justify-between items-start">
          <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className={`size-6 ${stat.color}`} />
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{stat.title}</p>
             <p className="text-3xl font-black text-white tracking-tighter leading-none">{stat.value}</p>
          </div>
        </div>
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-4">{stat.subtitle}</p>
      </div>
    );
  };

  const totalStudentsCard = {
    title: "Enrolled Intelligence",
    value: analytics?.totalStudents ?? 0,
    icon: Users,
    color: "text-white",
    bg: "bg-white/10",
    subtitle: "Active student nodes"
  };

  const gradeStatCards = [
    {
      title: "Performance Mean",
      value: `${analytics?.passRate ?? 0}%`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      subtitle: "Aggregate success vector"
    },
    {
      title: "Grading Velocity",
      value: `${analytics?.gradedStudents ?? 0}/${analytics?.totalStudents ?? 0}`,
      icon: ClipboardList,
      color: "text-secondary",
      bg: "bg-secondary/10",
      subtitle: "Processed result sets"
    },
    {
      title: "Academic Risk",
      value: analytics?.failingStudents ?? 0,
      icon: AlertTriangle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      subtitle: "Intervention required"
    }
  ];

  return (
    <AppShell activeTab="analytics">
      <div className="flex flex-col gap-8 pb-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] glass-panel flex items-center justify-center border border-white/20 p-1.5 shadow-none">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">
                <Target className="size-8" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1.5">Intelligence Telemetry</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Academic <span className="text-secondary">Analytics</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={activePeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[200px] h-14 rounded-2xl glass-panel border-white/10 text-white font-black text-[11px] uppercase tracking-widest outline-none focus:ring-0 cursor-pointer px-6">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/90 backdrop-blur-xl border-white/10 text-white">
                {["p1", "p2", "p3", "p4", "p5", "p6"].map(p => (
                  <SelectItem key={p} value={p} className="focus:bg-white/10 focus:text-white cursor-pointer font-black text-[10px] uppercase tracking-widest py-3">
                    Period {p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
              Live Feed
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analyticsLoading ? (
             Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-[2rem] bg-white/5" />)
          ) : (
            <>
              {renderStatCard(totalStudentsCard)}
              {gradeStatCards.map(renderStatCard)}
            </>
          )}
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
           <div className="glass-card p-8 border border-white/10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Performance Vector Trend</h3>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Cross-period academic momentum</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 glass-panel !rounded-xl">
                  <TrendingUp className="size-3 text-emerald-500" />
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">+4.2% Growth</span>
                </div>
              </div>
              <div className="h-[350px]">
                <SubjectTrendsChart data={trendData} isLoading={trendLoading} />
              </div>
           </div>

           <div className="glass-card p-8 border border-white/10 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Outcome Distribution</h3>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Pass/Fail metric analysis</p>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <PassFailChart 
                  data={[
                    { name: "Passing", value: analytics?.passingStudents ?? 0 },
                    { name: "Failing", value: analytics?.failingStudents ?? 0 }
                  ]} 
                  isLoading={analyticsLoading} 
                />
              </div>
           </div>
        </div>

        {/* Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Class Rankings */}
           <div className="glass-card p-8 border border-white/10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Class Ranking Matrix</h3>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Comparative performance by cohort</p>
                </div>
                <Award className="size-5 text-secondary" />
              </div>
              <div className="h-[400px]">
                <ClassPerformanceChart data={classPerf} isLoading={classPerfLoading} />
              </div>
           </div>

           {/* High Achievers & Risk Nodes */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-8 flex flex-col border border-white/10">
                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Award className="size-4" /> Elite Tier
                </h4>
                <div className="space-y-4">
                  {topStudentsLoading ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/5" />)
                  ) : topStudents.length > 0 ? (
                    topStudents.slice(0, 6).map((student, index) => (
                      <div key={index} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-500 group-hover:scale-110 transition-transform">
                          {student.average}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white truncate">{student.name}</p>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{student.class}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] font-black text-white/20 uppercase text-center py-8">No data nodes</p>
                  )}
                </div>
              </div>

              <div className="glass-panel p-8 flex flex-col border border-white/10">
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <AlertTriangle className="size-4" /> Risk Nodes
                </h4>
                <div className="space-y-4">
                  {atRiskLoading ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/5" />)
                  ) : atRiskStudents.length > 0 ? (
                    atRiskStudents.slice(0, 6).map((student, index) => (
                      <div key={index} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-[10px] font-black text-rose-500 group-hover:scale-110 transition-transform">
                          {student.average}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white truncate">{student.name}</p>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{student.class}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] font-black text-white/20 uppercase text-center py-8">Stable cluster</p>
                  )}
                </div>
              </div>
           </div>
        </div>

        {/* Demographics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-8 border border-white/10">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <UserCheck className="size-4 text-secondary" /> Gender Distribution
              </h4>
              <DemographicsChart title="" data={demographics?.gender ?? []} isLoading={demographicsLoading} icon={null} />
            </div>
            <div className="glass-card p-8 border border-white/10">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Globe className="size-4 text-secondary" /> Religious Diversity
              </h4>
              <DemographicsChart title="" data={demographics?.religion ?? []} isLoading={demographicsLoading} icon={null} />
            </div>
            <div className="glass-card p-8 border border-white/10">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <MapPin className="size-4 text-emerald-500" /> Regional Density
              </h4>
              <DemographicsChart title="" data={demographics?.county ?? []} isLoading={demographicsLoading} icon={null} />
            </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Analytics;
