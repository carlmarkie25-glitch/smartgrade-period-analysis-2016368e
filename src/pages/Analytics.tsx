import AppShell from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Award, AlertTriangle, Users, Target, Eye, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, useTopStudents, useClassifiedStudents, useClassPerformance, usePerformanceTrend } from "@/hooks/useAnalytics";
import { useTeacherAnalytics, useTeacherTopStudents, useTeacherAtRiskStudents, useTeacherClassPerformance, useTeacherPerformanceTrend } from "@/hooks/useTeacherAnalytics";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useState } from "react";
import PassFailChart from "@/components/analytics/PassFailChart";
import ClassPerformanceChart from "@/components/analytics/ClassPerformanceChart";
import SubjectTrendsChart from "@/components/analytics/SubjectTrendsChart";

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("p3");
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();

  const { data: adminAnalytics, isLoading: adminAnalyticsLoading } = useAnalytics(selectedPeriod);
  const { data: adminTopStudents = [], isLoading: adminTopLoading } = useTopStudents(selectedPeriod);
  const { data: adminClassified, isLoading: adminClassifiedLoading } = useClassifiedStudents(selectedPeriod);
  const { data: adminClassPerf = [], isLoading: adminClassPerfLoading } = useClassPerformance(selectedPeriod);
  const { data: adminTrend = [], isLoading: adminTrendLoading } = usePerformanceTrend();

  const { data: teacherAnalytics, isLoading: teacherAnalyticsLoading } = useTeacherAnalytics(selectedPeriod);
  const { data: teacherTopStudents = [], isLoading: teacherTopLoading } = useTeacherTopStudents(selectedPeriod);
  const { data: teacherAtRisk = [], isLoading: teacherAtRiskLoading } = useTeacherAtRiskStudents(selectedPeriod);
  const { data: teacherClassPerf = [], isLoading: teacherClassPerfLoading } = useTeacherClassPerformance(selectedPeriod);
  const { data: teacherTrend = [], isLoading: teacherTrendLoading } = useTeacherPerformanceTrend();

  const analyticsData = isAdmin ? adminAnalytics : teacherAnalytics;
  const analyticsLoading = rolesLoading || (isAdmin ? adminAnalyticsLoading : teacherAnalyticsLoading);
  const topStudents = isAdmin ? adminTopStudents : teacherTopStudents;
  const topStudentsLoading = rolesLoading || (isAdmin ? adminTopLoading : teacherTopLoading);
  const classPerformance = isAdmin ? adminClassPerf : teacherClassPerf;
  const classPerformanceLoading = rolesLoading || (isAdmin ? adminClassPerfLoading : teacherClassPerfLoading);
  const trendData = isAdmin ? adminTrend : teacherTrend;
  const trendLoading = rolesLoading || (isAdmin ? adminTrendLoading : teacherTrendLoading);

  const classifiedLoading = rolesLoading || (isAdmin ? adminClassifiedLoading : teacherAtRiskLoading);

  const pageTitle = isAdmin ? "Analytics" : "My Class Analytics";
  const pageDescription = isAdmin ? "School-wide performance analysis" : "Performance analysis for your classes";
  const topLabel = isAdmin ? "School-Wide Top 5" : "Top 5 in My Classes";

  const statCards = [
    {
      title: "Total Students",
      value: analyticsData?.totalStudents ?? 0,
      subtitle: "enrolled this period",
      icon: Users,
      bgColor: "bg-[hsl(210,60%,96%)]",
      iconBg: "bg-[hsl(210,60%,90%)]",
      iconColor: "text-[hsl(210,60%,45%)]",
    },
    {
      title: "Pass Rate",
      value: `${analyticsData?.passRate ?? 0}%`,
      subtitle: `${analyticsData?.passingStudents ?? 0} students above 60%`,
      icon: TrendingUp,
      bgColor: "bg-[hsl(145,45%,95%)]",
      iconBg: "bg-[hsl(145,45%,88%)]",
      iconColor: "text-[hsl(145,50%,35%)]",
    },
    {
      title: "Fail Rate",
      value: `${analyticsData?.failRate ?? 0}%`,
      subtitle: `${analyticsData?.failingStudents ?? 0} students at 60% or below`,
      icon: AlertTriangle,
      bgColor: "bg-[hsl(0,60%,96%)]",
      iconBg: "bg-[hsl(0,60%,90%)]",
      iconColor: "text-[hsl(0,50%,45%)]",
    },
    {
      title: "Needing Attention",
      value: analyticsData?.needingAttentionCount ?? 0,
      subtitle: "avg between 73-75%",
      icon: Eye,
      bgColor: "bg-[hsl(35,60%,96%)]",
      iconBg: "bg-[hsl(35,60%,90%)]",
      iconColor: "text-[hsl(35,60%,40%)]",
    },
  ];

  const secondaryCards = [
    {
      title: "At Risk",
      value: analyticsData?.atRiskCount ?? 0,
      subtitle: "avg between 61-72%",
      icon: Target,
      bgColor: "bg-[hsl(25,70%,96%)]",
      iconBg: "bg-[hsl(25,70%,90%)]",
      iconColor: "text-[hsl(25,70%,40%)]",
    },
    {
      title: "Failed",
      value: analyticsData?.failedCount ?? 0,
      subtitle: "avg 60% and below",
      icon: XCircle,
      bgColor: "bg-[hsl(0,65%,96%)]",
      iconBg: "bg-[hsl(0,65%,90%)]",
      iconColor: "text-[hsl(0,55%,45%)]",
    },
  ];

  // Build classified students list for display
  const needingAttention = isAdmin ? (adminClassified?.needingAttention || []) : teacherAtRisk.filter(s => s.average > 72 && s.average <= 75);
  const atRiskStudents = isAdmin ? (adminClassified?.atRisk || []) : teacherAtRisk.filter(s => s.average > 60 && s.average <= 72);
  const failedStudents = isAdmin ? (adminClassified?.failed || []) : teacherAtRisk.filter(s => s.average <= 60);

  const renderStudentCard = (student: { name: string; class: string; average: number }, index: number, color: { border: string; bg: string; hover: string; text: string; avatarBg: string; avatarText: string }) => (
    <div key={index} className={`flex items-center justify-between p-2.5 rounded-xl border ${color.border} ${color.bg} ${color.hover} transition-colors`}>
      <div className="flex items-center gap-2.5">
        <Avatar className="h-7 w-7">
          <AvatarImage src="" />
          <AvatarFallback className={`text-[9px] ${color.avatarBg} ${color.avatarText}`}>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-gray-900 text-xs leading-tight">{student.name}</p>
          <p className="text-[10px] text-gray-400">{student.class}</p>
        </div>
      </div>
      <span className={`text-sm font-bold ${color.text}`}>{student.average}%</span>
    </div>
  );

  const tealColor = { border: "border-[hsl(170,30%,90%)]", bg: "bg-[hsl(170,20%,98%)]", hover: "hover:bg-[hsl(170,25%,95%)]", text: "text-[hsl(170,50%,35%)]", avatarBg: "bg-[hsl(170,30%,90%)]", avatarText: "text-[hsl(170,50%,30%)]" };
  const amberColor = { border: "border-[hsl(35,40%,90%)]", bg: "bg-[hsl(35,30%,98%)]", hover: "hover:bg-[hsl(35,30%,95%)]", text: "text-[hsl(35,60%,40%)]", avatarBg: "bg-[hsl(35,30%,92%)]", avatarText: "text-[hsl(35,60%,40%)]" };
  const orangeColor = { border: "border-[hsl(25,50%,90%)]", bg: "bg-[hsl(25,30%,98%)]", hover: "hover:bg-[hsl(25,40%,95%)]", text: "text-[hsl(25,70%,40%)]", avatarBg: "bg-[hsl(25,40%,92%)]", avatarText: "text-[hsl(25,70%,40%)]" };
  const redColor = { border: "border-[hsl(0,40%,90%)]", bg: "bg-[hsl(0,30%,98%)]", hover: "hover:bg-[hsl(0,30%,95%)]", text: "text-[hsl(0,60%,50%)]", avatarBg: "bg-[hsl(0,30%,92%)]", avatarText: "text-[hsl(0,50%,45%)]" };

  const loadingSkeleton = (count: number) => (
    <div className="space-y-2.5">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50">
          <Skeleton className="h-7 w-7 rounded-full" />
          <div className="flex-1"><Skeleton className="h-3 w-24 mb-1" /><Skeleton className="h-2.5 w-16" /></div>
          <Skeleton className="h-5 w-10" />
        </div>
      ))}
    </div>
  );

  return (
    <AppShell activeTab="analytics">
      <div className="py-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{pageTitle}</h1>
            <p className="text-sm text-gray-500">{pageDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="2024-2025">
              <SelectTrigger className="w-[130px] h-8 text-xs bg-white/70 border-[hsl(170,30%,85%)]/30">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2023-2024">2023-2024</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-white/70 border-[hsl(170,30%,85%)]/30">
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

        {/* Stat Cards Row 1 */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Performance Overview</h3>
            <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">This Period</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {analyticsLoading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50">
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-6 w-12 mb-1" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                ))
              : statCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.title} className={`p-3 rounded-xl ${stat.bgColor} transition-colors`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-gray-500">{stat.title}</span>
                        <div className={`w-7 h-7 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                          <Icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
                        </div>
                      </div>
                      <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{stat.subtitle}</p>
                    </div>
                  );
                })}
          </div>
          {/* Secondary stat cards */}
          {!analyticsLoading && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {secondaryCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className={`p-3 rounded-xl ${stat.bgColor} transition-colors`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-medium text-gray-500">{stat.title}</span>
                      <div className={`w-7 h-7 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                        <Icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{stat.subtitle}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          <SubjectTrendsChart data={trendData} isLoading={trendLoading} />
          <PassFailChart passRate={analyticsData?.passRate || 0} failRate={analyticsData?.failRate || 0} />
        </div>

        <ClassPerformanceChart data={classPerformance} isLoading={classPerformanceLoading} />

        {/* Top Students (90%+) */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-[hsl(170,50%,35%)]" />
                {topLabel}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Exceptional students with 90% average and above</p>
            </div>
            <Badge className="bg-[hsl(145,45%,92%)] text-[hsl(145,50%,30%)] border-[hsl(145,40%,85%)] text-[10px] hover:bg-[hsl(145,45%,88%)]">90%+</Badge>
          </div>
          {topStudentsLoading ? loadingSkeleton(5) : topStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Award className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No students with 90%+ average this period</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-2.5 rounded-xl border border-[hsl(170,30%,90%)] bg-[hsl(170,20%,98%)] hover:bg-[hsl(170,25%,95%)] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(170,40%,93%)] text-[hsl(170,50%,30%)] font-bold text-[10px]">
                      {index + 1}
                    </div>
                    <Avatar className="h-7 w-7">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-[9px] bg-[hsl(170,30%,90%)] text-[hsl(170,50%,30%)]">{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900 text-xs leading-tight">{student.name}</p>
                      <p className="text-[10px] text-gray-400">{student.class}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[hsl(170,50%,35%)]">{student.average}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Classifications: Needing Attention, At Risk, Failed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Needing Attention: 73-75% */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[hsl(35,60%,45%)]" />
                  Needing Attention
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Average between 73-75%</p>
              </div>
              <Badge className="bg-[hsl(35,50%,92%)] text-[hsl(35,60%,35%)] border-[hsl(35,40%,85%)] text-[10px] hover:bg-[hsl(35,50%,88%)]">≤75%</Badge>
            </div>
            {classifiedLoading ? loadingSkeleton(3) : needingAttention.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Eye className="h-5 w-5 mx-auto mb-1.5 opacity-50" />
                <p className="text-xs">No students in this range</p>
              </div>
            ) : (
              <div className="space-y-2">{needingAttention.map((s, i) => renderStudentCard(s, i, amberColor))}</div>
            )}
          </div>

          {/* At Risk: 61-72% */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[hsl(25,70%,45%)]" />
                  At Risk
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Average between 61-72%</p>
              </div>
              <Badge className="bg-[hsl(25,50%,92%)] text-[hsl(25,70%,35%)] border-[hsl(25,40%,85%)] text-[10px] hover:bg-[hsl(25,50%,88%)]">≤72%</Badge>
            </div>
            {classifiedLoading ? loadingSkeleton(3) : atRiskStudents.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <AlertTriangle className="h-5 w-5 mx-auto mb-1.5 opacity-50" />
                <p className="text-xs">No at-risk students</p>
              </div>
            ) : (
              <div className="space-y-2">{atRiskStudents.map((s, i) => renderStudentCard(s, i, orangeColor))}</div>
            )}
          </div>

          {/* Failed: ≤60% */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-[hsl(0,60%,50%)]" />
                  Failed
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Average 60% and below</p>
              </div>
              <Badge className="bg-[hsl(0,50%,94%)] text-[hsl(0,55%,40%)] border-[hsl(0,40%,88%)] text-[10px] hover:bg-[hsl(0,50%,90%)]">≤60%</Badge>
            </div>
            {classifiedLoading ? loadingSkeleton(3) : failedStudents.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <XCircle className="h-5 w-5 mx-auto mb-1.5 opacity-50" />
                <p className="text-xs">No failed students</p>
              </div>
            ) : (
              <div className="space-y-2">{failedStudents.map((s, i) => renderStudentCard(s, i, redColor))}</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Analytics;
