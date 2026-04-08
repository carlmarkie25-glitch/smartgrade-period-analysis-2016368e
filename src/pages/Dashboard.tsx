import { DashboardLayout } from "@/components/dashboard";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, TrendingUp, FileText, Clock, CheckCircle, AlertCircle, User, CalendarDays } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTeacherDashboardStats, useTeacherClasses, useTeacherRecentGrades } from "@/hooks/useTeacherData";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { isAdmin, isTeacher, isStudent, roles, isLoading: rolesLoading } = useUserRoles();

  if (rolesLoading) {
    return (
      <AppShell activeTab="dashboard">
        <div className="py-4">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
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
  return <DashboardLayout />;
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
    <AppShell activeTab="dashboard">
      <div className="py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Teacher Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back! Here's your class overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(210,60%,85%)]/30 p-4 shadow-sm">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          ) : (
            statItems.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                    <div className="w-8 h-8 rounded-lg bg-[hsl(210,60%,93%)] flex items-center justify-center">
                      <Icon className="h-4 w-4 text-[hsl(170,50%,35%)]" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-[10px] text-gray-400 mt-1">{stat.change}</p>
                </div>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">My Classes</h3>
            <p className="text-[10px] text-gray-400 mb-3">Classes assigned to you</p>
            {classesLoading ? (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : classes && classes.length > 0 ? (
              <div className="space-y-2">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-3 rounded-xl border border-[hsl(210,60%,90%)] bg-[hsl(210,80%,97%)] hover:bg-[hsl(210,70%,95%)] transition-colors cursor-pointer"
                    onClick={() => navigate("/gradebook")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                        <p className="text-[10px] text-gray-400">{cls.departments?.name}</p>
                      </div>
                      <Badge className="text-[9px] bg-[hsl(210,60%,93%)] text-[hsl(220,60%,25%)] border-0">{cls.academic_years?.year_name}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No classes assigned yet</p>
              </div>
            )}
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
            <p className="text-[10px] text-gray-400 mb-3">Your latest grading updates</p>
            {gradesLoading ? (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentGrades && recentGrades.length > 0 ? (
              <div className="space-y-2">
                {recentGrades.map((grade) => (
                  <div key={grade.id} className="flex items-start gap-2.5 pb-2.5 border-b border-[hsl(210,70%,92%)] last:border-0">
                    <div className="h-7 w-7 rounded-full bg-[hsl(210,60%,93%)] flex items-center justify-center">
                      <CheckCircle className="h-3.5 w-3.5 text-[hsl(220,60%,30%)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{grade.students?.full_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {grade.class_subjects?.subjects?.name} • {grade.class_subjects?.classes?.name}
                      </p>
                      <p className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDistanceToNow(new Date(grade.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 bg-[hsl(210,80%,96%)] px-1.5 py-0.5 rounded">
                      {grade.score !== null ? `${grade.score}/${grade.max_score}` : "--"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No recent activity</p>
              </div>
            )}
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <p className="text-[10px] text-gray-400 mb-3">Frequently used features</p>
            <div className="space-y-2">
              {[
                { label: "Enter Grades", description: "Add or edit student grades", icon: BookOpen, path: "/gradebook", color: "hsl(210,60%,50%)" },
                  { label: "View Reports", description: "Generate student report cards", icon: FileText, path: "/reports", color: "hsl(220,60%,35%)" },
                { label: "View Schedule", description: "See today's classes", icon: CalendarDays, path: "/schedule", color: "hsl(35,60%,50%)" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="p-3 rounded-xl border border-[hsl(210,60%,90%)] bg-[hsl(210,80%,97%)] hover:bg-[hsl(210,70%,95%)] transition-colors text-left flex items-center gap-3 w-full"
                  >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${action.color}15` }}>
                      <Icon className="h-4 w-4" style={{ color: action.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">{action.label}</p>
                      <p className="text-[10px] text-gray-400">{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const NoRoleDashboard = () => {
  const { signOut } = useAuth();
  
  return (
    <AppShell activeTab="dashboard">
      <div className="py-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(210,60%,85%)]/30 p-8 shadow-sm">
            <div className="mx-auto h-14 w-14 rounded-full bg-[hsl(35,60%,93%)] flex items-center justify-center mb-4">
              <AlertCircle className="h-7 w-7 text-[hsl(35,60%,45%)]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Role Not Assigned</h2>
            <p className="text-sm text-gray-500 mb-4">
              Your account has been created, but an administrator has not yet assigned you a role.
            </p>
            <div className="p-3 bg-[hsl(210,80%,96%)] rounded-xl text-xs text-gray-500 mb-4">
              <p>Please contact your school administrator to have your role assigned.</p>
            </div>
            <button
              onClick={signOut}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  
  return (
    <AppShell activeTab="dashboard">
      <div className="py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Student Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome! View your academic progress here.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: User, label: "My Profile", desc: "View your personal information", color: "hsl(210,60%,50%)" },
            { icon: FileText, label: "My Grades", desc: "View your academic performance", color: "hsl(220,60%,35%)" },
            { icon: BookOpen, label: "My Report Card", desc: "View and download report cards", color: "hsl(35,60%,50%)" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(210,60%,85%)]/30 p-5 shadow-sm">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${item.color}15` }}>
                  <Icon className="h-5 w-5" style={{ color: item.color }} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{item.label}</h3>
                <p className="text-[11px] text-gray-400">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
