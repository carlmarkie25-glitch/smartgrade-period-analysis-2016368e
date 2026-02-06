import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, TrendingUp, FileText, Clock, CheckCircle, AlertCircle, User } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTeacherDashboardStats, useTeacherClasses, useTeacherRecentGrades } from "@/hooks/useTeacherData";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import EnrollmentChart from "@/components/dashboard/EnrollmentChart";
import GradeDistributionChart from "@/components/dashboard/GradeDistributionChart";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import StatsWidget from "@/components/dashboard/StatsWidget";
import SummaryCard from "@/components/dashboard/SummaryCard";

const Dashboard = () => {
  const { isAdmin, isTeacher, isStudent, roles, isLoading: rolesLoading } = useUserRoles();

  if (rolesLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!roles || roles.length === 0) {
    return <NoRoleDashboard />;
  }

  if (isStudent && !isAdmin && !isTeacher) {
    return <StudentDashboard />;
  }

  const showTeacherView = isTeacher && !isAdmin;
  
  return showTeacherView ? <TeacherDashboard /> : <AdminDashboard />;
};

const AdminDashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const navigate = useNavigate();

  const departmentStats = [
    { label: "Class Completion", value: 85, colorClass: "bg-secondary" },
    { label: "Teacher Activity", value: 72, colorClass: "bg-primary" },
    { label: "Grade Submissions", value: 91, colorClass: "bg-success" },
    { label: "Report Generation", value: 68, colorClass: "bg-chart-5" },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">ACADEMY - EXECUTIVE OVERVIEW</h1>
          <p className="text-muted-foreground">Welcome back! Here's your school overview.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SummaryCard
            title="Students"
            subtitle={`Total enrolled - ${new Date().getFullYear()}`}
            icon={Users}
            stats={[
              { value: stats?.totalStudents.toString() || "0", label: "Total" },
              { value: stats?.totalClasses.toString() || "0", label: "Classes" },
              { value: "95%", label: "Attendance" },
            ]}
          />
          <SummaryCard
            title="Faculty"
            subtitle={`Academic year - ${stats?.currentYear || "N/A"}`}
            icon={GraduationCap}
            stats={[
              { value: "24", label: "Teachers" },
              { value: "8", label: "Departments" },
              { value: "Active", label: "Status" },
            ]}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <EnrollmentChart />
          <StatsWidget title="Performance Metrics" stats={departmentStats} />
        </div>

        {/* Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <GradeDistributionChart />
          <PerformanceChart />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Enter Grades", icon: BookOpen, path: "/gradebook" },
                { label: "Generate Report", icon: FileText, path: "/reports" },
                { label: "View Analytics", icon: TrendingUp, path: "/analytics" },
                { label: "Admin Panel", icon: Users, path: "/admin" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition-colors">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

const TeacherDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useTeacherDashboardStats();
  const { data: classes, isLoading: classesLoading } = useTeacherClasses();
  const { data: recentGrades, isLoading: gradesLoading } = useTeacherRecentGrades();
  const navigate = useNavigate();

  const statItems = [
    { icon: Users, label: "My Students", value: stats?.totalStudents.toString() || "0", change: "In my classes" },
    { icon: BookOpen, label: "My Classes", value: stats?.totalClasses.toString() || "0", change: "Assigned to me" },
    { icon: FileText, label: "Subjects", value: stats?.totalSubjects.toString() || "0", change: "Teaching" },
    { icon: GraduationCap, label: "Academic Year", value: stats?.currentYear || "N/A", change: "Current" },
  ];

  const isLoading = statsLoading || classesLoading;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your class overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            statItems.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <Icon className="h-4 w-4 text-secondary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Classes assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              {classesLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : classes && classes.length > 0 ? (
                <div className="space-y-3">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => navigate("/gradebook")}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{cls.name}</p>
                          <p className="text-xs text-muted-foreground">{cls.departments?.name}</p>
                        </div>
                        <Badge variant="secondary">{cls.academic_years?.year_name}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No classes assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest grading updates</CardDescription>
            </CardHeader>
            <CardContent>
              {gradesLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : recentGrades && recentGrades.length > 0 ? (
                <div className="space-y-3">
                  {recentGrades.map((grade) => (
                    <div key={grade.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{grade.students?.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {grade.class_subjects?.subjects?.name} • {grade.class_subjects?.classes?.name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(grade.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {grade.score !== null ? `${grade.score}/${grade.max_score}` : "--"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: "Enter Grades", description: "Add or edit student grades", icon: BookOpen, path: "/gradebook", colorClass: "bg-secondary/10 text-secondary" },
                  { label: "View Reports", description: "Generate student report cards", icon: FileText, path: "/reports", colorClass: "bg-success/10 text-success" },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left flex items-center gap-4"
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{action.label}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

const NoRoleDashboard = () => {
  const { signOut } = useAuth();
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="mx-auto h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Role Not Assigned</CardTitle>
              <CardDescription className="text-base">
                Your account has been created, but an administrator has not yet assigned you a role.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                <p>Please contact your school administrator to have your role assigned. Once assigned, you'll be able to access your personalized dashboard.</p>
              </div>
              <button
                onClick={signOut}
                className="w-full px-4 py-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
              >
                Sign Out
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

const StudentDashboard = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome! View your academic progress here.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
                <User className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>View your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Your personal details and academic information.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-2">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <CardTitle>My Grades</CardTitle>
              <CardDescription>View your academic performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Check your grades across all subjects and periods.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>My Report Card</CardTitle>
              <CardDescription>View and download report cards</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Access your complete report cards for each period.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
