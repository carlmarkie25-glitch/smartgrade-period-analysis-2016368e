import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Award, AlertTriangle, Users, BarChart3, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, useTopStudents, useAtRiskStudents, useClassPerformance, usePerformanceTrend } from "@/hooks/useAnalytics";
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
  const { data: adminAtRisk = [], isLoading: adminAtRiskLoading } = useAtRiskStudents(selectedPeriod);
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
  const atRiskStudents = isAdmin ? adminAtRisk : teacherAtRisk;
  const atRiskLoading = rolesLoading || (isAdmin ? adminAtRiskLoading : teacherAtRiskLoading);
  const classPerformance = isAdmin ? adminClassPerf : teacherClassPerf;
  const classPerformanceLoading = rolesLoading || (isAdmin ? adminClassPerfLoading : teacherClassPerfLoading);
  const trendData = isAdmin ? adminTrend : teacherTrend;
  const trendLoading = rolesLoading || (isAdmin ? adminTrendLoading : teacherTrendLoading);

  const pageTitle = isAdmin ? "Analytics" : "My Class Analytics";
  const pageDescription = isAdmin ? "School-wide performance analysis" : "Performance analysis for your classes";
  const topLabel = isAdmin ? "School-Wide Top 5" : "Top 5 in My Classes";

  const atRiskPercent = analyticsData?.totalStudents
    ? ((atRiskStudents.length / analyticsData.totalStudents) * 100).toFixed(1)
    : "0";

  const statCards = [
    {
      title: "Total Students",
      value: analyticsData?.totalStudents ?? 0,
      subtitle: "enrolled this period",
      icon: Users,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Pass Rate",
      value: `${analyticsData?.passRate ?? 0}%`,
      subtitle: `${analyticsData?.passingStudents ?? 0} students passing`,
      icon: TrendingUp,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      trend: analyticsData?.passRate ? { value: analyticsData.passRate, isPositive: analyticsData.passRate >= 50 } : undefined,
    },
    {
      title: "Fail Rate",
      value: `${analyticsData?.failRate ?? 0}%`,
      subtitle: `${analyticsData?.failingStudents ?? 0} students failing`,
      icon: AlertTriangle,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      trend: analyticsData?.failRate ? { value: analyticsData.failRate, isPositive: false } : undefined,
    },
    {
      title: "At Risk",
      value: atRiskStudents.length,
      subtitle: `${atRiskPercent}% of total`,
      icon: Target,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
    },
  ];

  return (
    <AppShell activeTab="analytics">
      <div className="py-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground">{pageDescription}</p>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="2024-2025">
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2023-2024">2023-2024</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
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

        {/* Stat Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsLoading
            ? Array(4).fill(0).map((_, i) => (
                <Card key={i} className="border border-border/50">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-3" />
                    <Skeleton className="h-7 w-16 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))
            : statCards.map((stat) => (
                <Card key={stat.title} className="border border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${stat.iconBg} shrink-0`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground truncate">{stat.title}</p>
                      <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{stat.subtitle}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Charts: Performance Trend (large) + Pass/Fail Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          <SubjectTrendsChart data={trendData} isLoading={trendLoading} />
          <PassFailChart passRate={analyticsData?.passRate || 0} failRate={analyticsData?.failRate || 0} />
        </div>

        {/* Class Performance (full width) */}
        <ClassPerformanceChart data={classPerformance} isLoading={classPerformanceLoading} />

        {/* Top Students and At Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-secondary/10">
                  <Award className="h-4 w-4 text-secondary" />
                </div>
                {topLabel}
              </CardTitle>
              <CardDescription className="text-xs">Highest performing students</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {topStudentsLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1"><Skeleton className="h-3.5 w-28 mb-1.5" /><Skeleton className="h-3 w-20" /></div>
                      <Skeleton className="h-6 w-10" />
                    </div>
                  ))}
                </div>
              ) : topStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">No data available for this period</p>
              ) : (
                <div className="space-y-2">
                  {topStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary/15 text-secondary font-bold text-xs">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm leading-tight">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground">{student.class}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-secondary">{student.average}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                Students Needing Attention
              </CardTitle>
              <CardDescription className="text-xs">Students failing 3 or more subjects</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {atRiskLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1"><Skeleton className="h-3.5 w-28 mb-1.5" /><Skeleton className="h-3 w-20" /></div>
                      <Skeleton className="h-6 w-10" />
                    </div>
                  ))}
                </div>
              ) : atRiskStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">No at-risk students found</p>
              ) : (
                <div className="space-y-2">
                  {atRiskStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 rounded-xl bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-[10px] bg-destructive/10 text-destructive">{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm leading-tight">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground">{student.class}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-destructive">{student.failingSubjects}</p>
                        <p className="text-[10px] text-muted-foreground">failing</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default Analytics;
