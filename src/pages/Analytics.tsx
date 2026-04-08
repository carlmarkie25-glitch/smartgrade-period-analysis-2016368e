import AppShell from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Award, AlertTriangle, Users, Target, ClipboardList, UserCheck, Globe, Church, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, useTopStudents, useAtRiskStudents, useClassPerformance, usePerformanceTrend } from "@/hooks/useAnalytics";
import { useTeacherAnalytics, useTeacherTopStudents, useTeacherAtRiskStudents, useTeacherClassPerformance, useTeacherPerformanceTrend } from "@/hooks/useTeacherAnalytics";
import { useStudentDemographics } from "@/hooks/useStudentDemographics";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { useState, useEffect, useMemo } from "react";
import PassFailChart from "@/components/analytics/PassFailChart";
import ClassPerformanceChart from "@/components/analytics/ClassPerformanceChart";
import SubjectTrendsChart from "@/components/analytics/SubjectTrendsChart";
import DemographicsChart from "@/components/analytics/DemographicsChart";

const Analytics = () => {
  const { data: academicPeriods = [] } = useAcademicPeriods();

  const currentActivePeriod = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    // Find period where today falls between start and end date
    const activePeriod = academicPeriods.find(
      (p) => p.start_date <= today && p.end_date >= today && ["p1","p2","p3","p4","p5","p6"].includes(p.period_type)
    );
    if (activePeriod) return activePeriod.period_type;
    // Fallback: find the most recent period that has already started
    const pastPeriods = academicPeriods
      .filter((p) => p.start_date <= today && ["p1","p2","p3","p4","p5","p6"].includes(p.period_type))
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
    if (pastPeriods.length > 0) return pastPeriods[0].period_type;
    return "p1";
  }, [academicPeriods]);

  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  
  useEffect(() => {
    if (!selectedPeriod && currentActivePeriod) {
      setSelectedPeriod(currentActivePeriod);
    }
  }, [currentActivePeriod, selectedPeriod]);

  const activePeriod = selectedPeriod || currentActivePeriod;
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();

  const { data: adminAnalytics, isLoading: adminAnalyticsLoading } = useAnalytics(activePeriod);
  const { data: adminTopStudents = [], isLoading: adminTopLoading } = useTopStudents(activePeriod);
  const { data: adminAtRisk = [], isLoading: adminAtRiskLoading } = useAtRiskStudents(activePeriod);
  const { data: adminClassPerf = [], isLoading: adminClassPerfLoading } = useClassPerformance(activePeriod);
  const { data: adminTrend = [], isLoading: adminTrendLoading } = usePerformanceTrend();

  const { data: teacherAnalytics, isLoading: teacherAnalyticsLoading } = useTeacherAnalytics(activePeriod);
  const { data: teacherTopStudents = [], isLoading: teacherTopLoading } = useTeacherTopStudents(activePeriod);
  const { data: teacherAtRisk = [], isLoading: teacherAtRiskLoading } = useTeacherAtRiskStudents(activePeriod);
  const { data: teacherClassPerf = [], isLoading: teacherClassPerfLoading } = useTeacherClassPerformance(activePeriod);
  const { data: teacherTrend = [], isLoading: teacherTrendLoading } = useTeacherPerformanceTrend();

  const { data: demographics, isLoading: demographicsLoading } = useStudentDemographics();

  const analyticsData = isAdmin ? adminAnalytics : teacherAnalytics;
  const analyticsLoading = rolesLoading || (isAdmin ? adminAnalyticsLoading : teacherAnalyticsLoading);
  const topStudents = isAdmin ? adminTopStudents : teacherTopStudents;
  const topStudentsLoading = rolesLoading || (isAdmin ? adminTopLoading : teacherTopLoading);
  const atRiskStudents = isAdmin ? adminAtRisk : teacherAtRisk;
  const atRiskLoading = rolesLoading || (isAdmin ? adminAtRiskLoading : teacherAtRiskLoading);
  const classPerformance = isAdmin ? adminClassPerf : teacherClassPerf;
  const classPerformanceLoading = rolesLoading || (isAdmin ? adminClassPerfLoading : teacherClassPerfLoading);
  const trendData = isAdmin ? adminTrend : teacherTrend;
  const trendLoading = rolesLoading || (isAdmin ? adminTrendLoading : teacherTrendLoading);

  const pageTitle = isAdmin ? "Analytics" : "My Class Analytics";
  const pageDescription = isAdmin ? "School-wide performance analysis" : "Performance analysis for your classes";
  const topLabel = isAdmin ? "School-Wide Top 5" : "Top 5 in My Classes";

  const allGraded = analyticsData?.allGraded ?? false;
  const gradedCount = analyticsData?.gradedStudents ?? 0;
  const totalCount = analyticsData?.totalStudents ?? 0;

  const atRiskPercent = analyticsData?.totalStudents
    ? ((atRiskStudents.length / analyticsData.totalStudents) * 100).toFixed(1)
    : "0";

  const nBg = "hsl(210, 80%, 96%)";
  const nShadow = "6px 6px 12px hsl(210, 80%, 88%), -6px -6px 12px hsl(0, 0%, 100%)";
  const nInset = "inset 3px 3px 6px hsl(210, 80%, 88%), inset -3px -3px 6px hsl(0, 0%, 100%)";

  // Total Students card is always visible
  const totalStudentsCard = {
    title: "Total Students",
    value: analyticsData?.totalStudents ?? 0,
    subtitle: "enrolled this period",
    icon: Users,
    iconColor: "text-[hsl(220,60%,35%)]",
  };

  // Grade-dependent stat cards
  const gradeStatCards = [
    {
      title: "Pass Rate",
      value: `${analyticsData?.passRate ?? 0}%`,
      subtitle: `${analyticsData?.passingStudents ?? 0} students passing`,
      icon: TrendingUp,
      iconColor: "text-[hsl(145,50%,40%)]",
    },
    {
      title: "Fail Rate",
      value: `${analyticsData?.failRate ?? 0}%`,
      subtitle: `${analyticsData?.failingStudents ?? 0} students failing`,
      icon: AlertTriangle,
      iconColor: "text-[hsl(0,50%,45%)]",
    },
    {
      title: "At Risk",
      value: atRiskStudents.length,
      subtitle: `${atRiskPercent}% of total`,
      icon: Target,
      iconColor: "text-[hsl(35,60%,45%)]",
    },
  ];

  const renderStatCard = (stat: typeof totalStudentsCard) => {
    const Icon = stat.icon;
    return (
      <div
        key={stat.title}
        className="p-3 rounded-[16px] transition-colors"
        style={{ background: nBg, boxShadow: nShadow }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-medium text-gray-500">{stat.title}</span>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: nBg, boxShadow: nInset }}
          >
            <Icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
          </div>
        </div>
        <div className="text-xl font-bold text-gray-800">{stat.value}</div>
        <p className="text-[10px] text-gray-400 mt-0.5">{stat.subtitle}</p>
      </div>
    );
  };

  return (
    <AppShell activeTab="analytics">
      <div className="py-4 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{pageTitle}</h1>
            <p className="text-sm text-gray-500">{pageDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="2024-2025">
              <SelectTrigger
                className="w-[130px] h-8 text-xs border-none"
                style={{ background: nBg, boxShadow: nInset }}
              >
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2023-2024">2023-2024</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activePeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger
                className="w-[120px] h-8 text-xs border-none"
                style={{ background: nBg, boxShadow: nInset }}
              >
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="p1">Period 1</SelectItem>
                <SelectItem value="p2">Period 2</SelectItem>
                <SelectItem value="p3">Period 3</SelectItem>
                <SelectItem value="p4">Period 4</SelectItem>
                <SelectItem value="p5">Period 5</SelectItem>
                <SelectItem value="p6">Period 6</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Student Overview Card */}
        <div
          className="rounded-[24px] p-5"
          style={{ background: nBg, boxShadow: "10px 10px 20px hsl(210, 80%, 87%), -10px -10px 20px hsl(0, 0%, 100%)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">Student Overview</h3>
            <span
              className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: nBg, boxShadow: nInset }}
            >
              This Period
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {renderStatCard(totalStudentsCard)}
            {allGraded ? (
              gradeStatCards.map(renderStatCard)
            ) : (
              gradeStatCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className="p-3 rounded-[16px] relative"
                    style={{ background: nBg, boxShadow: nShadow }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-medium text-gray-500">{stat.title}</span>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: nBg, boxShadow: nInset }}
                      >
                        <Icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-300">--</div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Awaiting complete grades</p>
                    <div className="absolute bottom-1.5 right-3">
                      <ClipboardList className="h-3 w-3 text-[hsl(35,60%,65%)]" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Demographics Charts - always visible (not grade-dependent) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DemographicsChart title="Gender Distribution" data={demographics?.gender ?? []} isLoading={demographicsLoading} icon={<UserCheck className="h-4 w-4 text-[hsl(210,60%,50%)]" />} />
          <DemographicsChart title="Ethnicity Distribution" data={demographics?.ethnicity ?? []} isLoading={demographicsLoading} icon={<Globe className="h-4 w-4 text-[hsl(280,50%,50%)]" />} />
          <DemographicsChart title="Religion Distribution" data={demographics?.religion ?? []} isLoading={demographicsLoading} icon={<Church className="h-4 w-4 text-[hsl(35,60%,45%)]" />} />
          <DemographicsChart title="County Distribution" data={demographics?.county ?? []} isLoading={demographicsLoading} icon={<MapPin className="h-4 w-4 text-[hsl(145,50%,40%)]" />} />
        </div>

        {/* Grading progress banner */}
        {!allGraded && totalCount > 0 && (
          <div
            className="p-3 rounded-[16px] flex items-center gap-3"
            style={{ background: nBg, boxShadow: nShadow }}
          >
            <ClipboardList className="h-5 w-5 text-[hsl(35,60%,45%)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-[hsl(35,50%,30%)]">Grading In Progress</p>
              <p className="text-[10px] text-[hsl(35,40%,40%)]">{gradedCount}/{totalCount} students have complete grades</p>
              <div className="w-full bg-[hsl(210,70%,90%)] rounded-full h-1.5 mt-1">
                <div className="bg-[hsl(220,60%,35%)] h-1.5 rounded-full transition-all" style={{ width: totalCount > 0 ? `${(gradedCount / totalCount) * 100}%` : "0%" }} />
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          <SubjectTrendsChart data={allGraded ? trendData : []} isLoading={allGraded && trendLoading} />
          <PassFailChart passRate={allGraded ? (analyticsData?.passRate || 0) : 0} failRate={allGraded ? (analyticsData?.failRate || 0) : 0} awaitingGrades={!allGraded} />
        </div>

        <ClassPerformanceChart data={allGraded ? classPerformance : []} isLoading={allGraded && classPerformanceLoading} />

        {/* Top Students and At Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Students */}
          <div
            className="rounded-[22px] p-5"
            style={{ background: nBg, boxShadow: "8px 8px 16px hsl(170, 25%, 88%), -8px -8px 16px hsl(0, 0%, 100%)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Award className="h-4 w-4 text-[hsl(220,60%,35%)]" />
                  {topLabel}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Exceptional students with 90%+ average</p>
              </div>
              <span
                className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: nBg, boxShadow: nInset }}
              >
                90%+
              </span>
            </div>
            {!allGraded ? (
              <div className="text-center py-8 text-gray-400">
                <ClipboardList className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Awaiting complete grades for this period</p>
                <p className="text-[10px] mt-1 text-gray-300">{gradedCount}/{totalCount} students graded</p>
              </div>
            ) : topStudentsLoading ? (
              <div className="space-y-2.5">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-[14px]" style={{ background: nBg, boxShadow: nShadow }}>
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="flex-1"><Skeleton className="h-3 w-24 mb-1" /><Skeleton className="h-2.5 w-16" /></div>
                    <Skeleton className="h-5 w-10" />
                  </div>
                ))}
              </div>
            ) : topStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Award className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No students with 90%+ average this period</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topStudents.map((student, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-[14px] transition-all duration-200"
                    style={{ background: nBg, boxShadow: nShadow }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = nInset; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = nShadow; }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center justify-center w-6 h-6 rounded-full text-[hsl(220,60%,30%)] font-bold text-[10px]"
                        style={{ background: nBg, boxShadow: nInset }}
                      >
                        {index + 1}
                      </div>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-[9px] bg-[hsl(210,60%,90%)] text-[hsl(220,60%,25%)]">{student.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-700 text-xs leading-tight">{student.name}</p>
                        <p className="text-[10px] text-gray-400">{student.class}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[hsl(220,60%,35%)]">{student.average}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* At Risk Students */}
          <div
            className="rounded-[22px] p-5"
            style={{ background: nBg, boxShadow: "8px 8px 16px hsl(170, 25%, 88%), -8px -8px 16px hsl(0, 0%, 100%)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[hsl(0,60%,50%)]" />
                  Students Needing Attention
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Students with 75% average and below</p>
              </div>
              <span
                className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: nBg, boxShadow: nInset }}
              >
                ≤75%
              </span>
            </div>
            {!allGraded ? (
              <div className="text-center py-8 text-gray-400">
                <ClipboardList className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Awaiting complete grades for this period</p>
                <p className="text-[10px] mt-1 text-gray-300">{gradedCount}/{totalCount} students graded</p>
              </div>
            ) : atRiskLoading ? (
              <div className="space-y-2.5">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-[14px]" style={{ background: nBg, boxShadow: nShadow }}>
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="flex-1"><Skeleton className="h-3 w-24 mb-1" /><Skeleton className="h-2.5 w-16" /></div>
                    <Skeleton className="h-5 w-10" />
                  </div>
                ))}
              </div>
            ) : atRiskStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No students needing attention</p>
              </div>
            ) : (
              <div className="space-y-2">
                {atRiskStudents.map((student, index) => {
                  const isAtRisk = student.average <= 72 && student.average > 60;
                  const isFailed = student.average <= 60;
                  const textColor = isFailed ? "text-[hsl(0,60%,50%)]" : isAtRisk ? "text-[hsl(25,70%,40%)]" : "text-[hsl(35,60%,40%)]";
                  const label = isFailed ? "Failed" : isAtRisk ? "At Risk" : "Attention";

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 rounded-[14px] transition-all duration-200"
                      style={{ background: nBg, boxShadow: nShadow }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = nInset; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = nShadow; }}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-[9px] bg-[hsl(210,60%,90%)] text-gray-600">{student.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-700 text-xs leading-tight">{student.name}</p>
                          <p className="text-[10px] text-gray-400">{student.class}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${textColor}`}>{student.average}%</p>
                        <p className={`text-[9px] ${textColor} opacity-70`}>{label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Analytics;

