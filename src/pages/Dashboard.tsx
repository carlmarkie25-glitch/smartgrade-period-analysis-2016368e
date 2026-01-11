import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, TrendingUp, FileText, Clock, CheckCircle } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTeacherDashboardStats, useTeacherClasses, useTeacherRecentGrades } from "@/hooks/useTeacherData";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, isTeacher, isLoading: rolesLoading } = useUserRoles();

  // Show teacher dashboard if user is a teacher but not an admin
  const showTeacherView = isTeacher && !isAdmin;

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

  return showTeacherView ? <TeacherDashboard /> : <AdminDashboard />;
};

const AdminDashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const navigate = useNavigate();

  const statItems = [
    { 
      icon: Users, 
      label: "Total Students", 
      value: stats?.totalStudents.toString() || "0", 
      change: "Active" 
    },
    { 
      icon: BookOpen, 
      label: "Active Classes", 
      value: stats?.totalClasses.toString() || "0", 
      change: "Current Year" 
    },
    { 
      icon: GraduationCap, 
      label: "Academic Year", 
      value: stats?.currentYear || "N/A", 
      change: "Active" 
    },
    { 
      icon: TrendingUp, 
      label: "System Status", 
      value: "Active", 
      change: "All Systems" 
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your school overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-primary" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your school</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "Grades submitted", subject: "Mathematics P3", time: "2 hours ago" },
                  { action: "Report generated", subject: "Grade 10A", time: "5 hours ago" },
                  { action: "New student enrolled", subject: "Grade 9B", time: "1 day ago" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
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
                      className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                    >
                      <Icon className="h-6 w-6 text-primary mb-2" />
                      <p className="text-sm font-medium text-foreground">{action.label}</p>
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

const TeacherDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useTeacherDashboardStats();
  const { data: classes, isLoading: classesLoading } = useTeacherClasses();
  const { data: recentGrades, isLoading: gradesLoading } = useTeacherRecentGrades();
  const navigate = useNavigate();

  const statItems = [
    { 
      icon: Users, 
      label: "My Students", 
      value: stats?.totalStudents.toString() || "0", 
      change: "In my classes" 
    },
    { 
      icon: BookOpen, 
      label: "My Classes", 
      value: stats?.totalClasses.toString() || "0", 
      change: "Assigned to me" 
    },
    { 
      icon: FileText, 
      label: "Subjects", 
      value: stats?.totalSubjects.toString() || "0", 
      change: "Teaching" 
    },
    { 
      icon: GraduationCap, 
      label: "Academic Year", 
      value: stats?.currentYear || "N/A", 
      change: "Current" 
    },
  ];

  const isLoading = statsLoading || classesLoading;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your class overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-primary" />
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
          {/* My Classes */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Classes assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              {classesLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
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
                          <p className="text-xs text-muted-foreground">
                            {cls.departments?.name}
                          </p>
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

          {/* Recent Grading Activity */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest grading updates</CardDescription>
            </CardHeader>
            <CardContent>
              {gradesLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : recentGrades && recentGrades.length > 0 ? (
                <div className="space-y-3">
                  {recentGrades.map((grade) => (
                    <div key={grade.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {grade.students?.full_name}
                        </p>
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

          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { 
                    label: "Enter Grades", 
                    description: "Add or edit student grades",
                    icon: BookOpen, 
                    path: "/gradebook",
                    color: "bg-blue-500/10 text-blue-600"
                  },
                  { 
                    label: "View Reports", 
                    description: "Generate student report cards",
                    icon: FileText, 
                    path: "/reports",
                    color: "bg-green-500/10 text-green-600"
                  },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left flex items-center gap-4"
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.color}`}>
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

export default Dashboard;
