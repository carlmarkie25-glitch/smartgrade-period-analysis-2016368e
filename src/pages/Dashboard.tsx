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
import StudentPortal from "@/components/portals/StudentPortal";
import ParentPortal from "@/components/portals/ParentPortal";

const Dashboard = () => {
  const { isAdmin, isTeacher, isStudent, isParent, roles, isLoading: rolesLoading } = useUserRoles();

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

  // Admin > Teacher > Parent > Student precedence
  if (isAdmin) return <AdminDashboard />;
  if (isTeacher) return <TeacherDashboard />;
  if (isParent) return <ParentPortal />;
  if (isStudent) return <StudentPortal />;

  const showTeacherView = false;
  
  return showTeacherView ? <TeacherDashboard /> : <AdminDashboard />;
};

const AdminDashboard = () => {
  return <DashboardLayout />;
};

const TeacherDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useTeacherDashboardStats();
  const { data: classes, isLoading: classesLoading } = useTeacherClasses();
  const { data: recentGrades, isLoading: gradesLoading } = useTeacherRecentGrades();
  const { user } = useAuth();
  const navigate = useNavigate();

  const profileName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Teacher";
  const initials = profileName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const isLoading = statsLoading || classesLoading;

  return (
    <AppShell activeTab="dashboard">
      <div className="flex flex-col gap-6 pb-6">
        
        {/* Welcome Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] glass-panel flex items-center justify-center border border-white/20 p-1.5 shadow-none">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-2xl font-black tracking-tighter">
                {initials}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1.5">Staff Control Panel</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Welcome, <span className="text-secondary">{profileName.split(' ')[0]}</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 glass-panel px-6 py-3 rounded-[1.5rem] shadow-none self-start lg:self-center">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-40" />
            </div>
            <span className="text-[11px] font-black text-white/80 uppercase tracking-[0.2em]">Active Session</span>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          
          {/* Left Column: Hero & Stats */}
          <div className="flex flex-col gap-6">
            {/* Hero Performance Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-10 bg-primary/30 backdrop-blur-3xl text-white min-h-[260px] flex flex-col justify-between border border-white/20 shadow-none group">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px] -mr-40 -mt-40 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[60px] -ml-32 -mb-32 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
              
              <div className="relative z-10">
                <Badge className="bg-white/10 text-white/80 border-0 px-3 py-1 mb-4 backdrop-blur-md uppercase tracking-widest text-[9px] font-black">Performance Analytics</Badge>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.1] max-w-lg">
                  Institutional Academic <br/><span className="text-secondary">Progress Matrix</span>
                </h2>
              </div>

              <div className="relative z-10 flex flex-wrap items-end justify-between gap-8 pt-6">
                <div className="flex gap-12">
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Grade Mean</p>
                    <div className="text-5xl font-black tracking-tighter flex items-baseline gap-1">
                      84.5<span className="text-xl text-white/40 font-bold">%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Completion</p>
                    <div className="text-5xl font-black tracking-tighter flex items-baseline gap-1">
                      92<span className="text-xl text-white/40 font-bold">%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 glass-panel px-6 py-4 rounded-[1.8rem] transition-all hover:bg-white/15 cursor-pointer shadow-none">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] leading-none mb-1">Status</span>
                    <span className="text-sm font-black text-secondary tracking-tight">OPTIONAL</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <TrendingUp className="size-5 text-secondary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Mini Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Classes", value: stats?.totalClasses?.toString() || "0", icon: GraduationCap, color: "text-white", bg: "bg-white/10" },
                { label: "Teacher Load", value: stats?.totalSubjects?.toString() || "0", icon: BookOpen, color: "text-secondary", bg: "bg-secondary/10" },
                { label: "Total Students", value: stats?.totalStudents?.toString() || "0", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "Pending Tasks", value: "05", icon: Clock, color: "text-cyan-500", bg: "bg-cyan-500/10" },
              ].map((stat, i) => (
                <div key={i} className="p-5 glass-panel flex flex-col justify-between min-h-[120px] transition-all hover:bg-white/10 shadow-none group">
                  <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`size-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5">{stat.label}</p>
                    <p className="text-2xl font-black text-white tracking-tighter">
                      {isLoading ? "..." : stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Actions & Schedule */}
          <div className="flex flex-col gap-6">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Gradebook", icon: BookOpen, path: "/gradebook", color: "bg-primary" },
                { label: "Schedule", icon: CalendarDays, path: "/schedule", color: "bg-secondary" },
                { label: "Reports", icon: FileText, path: "/reports", color: "bg-primary" },
                { label: "Settings", icon: User, path: "/profile", color: "bg-gray-800" },
              ].map((action, i) => (
                <button 
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="group flex flex-col items-center justify-center gap-4 p-6 glass-panel hover:bg-white/10 transition-all duration-500 shadow-none"
                >
                  <div className={`w-14 h-14 rounded-full ${action.color}/10 flex items-center justify-center group-hover:scale-110 transition-all duration-500`}>
                    <action.icon className={`size-6 text-white`} />
                  </div>
                  <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Compact Activity List Mini */}
            <div className="flex-1 glass-card p-8 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-white/70 uppercase tracking-widest">Recent Events</h3>
                <button className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <TrendingUp className="size-3 text-primary" />
                </button>
              </div>
              <div className="space-y-4">
                {recentGrades?.slice(0, 3).map((grade) => (
                  <div key={grade.id} className="flex items-center gap-4 p-3 glass-panel !rounded-[1.2rem] bg-white/5">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-secondary">
                      {grade.students?.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-white truncate">{grade.students?.full_name}</p>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">Graded • {grade.class_subjects?.subjects?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Full Width Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity List Full */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter">Recent Submissions</h3>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Latest academic updates</p>
              </div>
              <button className="px-5 py-2 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all">View Analytics</button>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {recentGrades?.map((grade) => (
                <div key={grade.id} className="group flex items-center gap-5 p-4 glass-panel !rounded-[1.8rem] bg-white/5 hover:border-white/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <CheckCircle className="size-5 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate tracking-tight">{grade.students?.full_name}</p>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                      {grade.class_subjects?.subjects?.name} · {grade.class_subjects?.classes?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-secondary tracking-tighter">
                      {grade.score !== null ? `${grade.score}/${grade.max_score}` : "--"}
                    </p>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">
                      {formatDistanceToNow(new Date(grade.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classes Display */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter">Academic Load</h3>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Active class management</p>
              </div>
              <div className="px-4 py-2 glass-pill text-[10px] font-black text-secondary uppercase tracking-widest border border-secondary/20">Active Term</div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {classes?.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => navigate("/gradebook")}
                  className="p-6 glass-panel !rounded-[2rem] bg-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer group shadow-none"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GraduationCap className="size-6 text-secondary" />
                    </div>
                    <Badge className="bg-secondary/10 text-secondary text-[10px] font-black border-0 px-3 py-1 uppercase tracking-widest">
                      {cls.academic_years?.year_name}
                    </Badge>
                  </div>
                  <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors leading-tight mb-1 tracking-tighter">{cls.name}</h4>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] truncate">{cls.departments?.name || "Academic Dept"}</p>
                </div>
              ))}
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
          <div className="glass-card p-8">
            <div className="mx-auto h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-7 w-7 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Role Not Assigned</h2>
            <p className="text-sm text-white/50 mb-4">
              Your account has been created, but an administrator has not yet assigned you a role.
            </p>
            <div className="p-3 bg-white/5 rounded-xl text-xs text-white/40 mb-4">
              <p>Please contact your school administrator to have your role assigned.</p>
            </div>
            <button
              onClick={signOut}
              className="text-sm font-medium text-red-400 hover:text-red-500 transition-colors"
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
          <h1 className="text-2xl font-bold text-white mb-1">Student Dashboard</h1>
          <p className="text-sm text-white/50">Welcome! View your academic progress here.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: User, label: "My Profile", desc: "View your personal information", color: "text-primary" },
            { icon: FileText, label: "My Grades", desc: "View your academic performance", color: "text-secondary" },
            { icon: BookOpen, label: "My Report Card", desc: "View and download report cards", color: "text-amber-500" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="glass-panel p-5">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 bg-white/5`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{item.label}</h3>
                <p className="text-[11px] text-white/30">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
