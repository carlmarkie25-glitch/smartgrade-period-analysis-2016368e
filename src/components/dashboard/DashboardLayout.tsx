import { Users, Clock, GraduationCap, TrendingUp } from "lucide-react";
import { StatCard } from "./StatCard";
import { AnalyticsChart } from "./AnalyticsChart";
import { ProfileSummary } from "./ProfileSummary";
import { Schedule } from "./Schedule";
import { ActivityList } from "./ActivityList";
import AppShell from "@/components/AppShell";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Badge } from "@/components/ui/badge";

const analyticsData = [
  { month: "Sun", students: 120, capacity: 200 },
  { month: "Mon", students: 280, capacity: 350 },
  { month: "Tue", students: 180, capacity: 300 },
  { month: "Wed", students: 350, capacity: 400 },
  { month: "Thu", students: 420, capacity: 450 },
  { month: "Fri", students: 380, capacity: 420 },
  { month: "Sat", students: 220, capacity: 300 },
];

export const DashboardLayout = () => {
  const { data: stats } = useDashboardStats();

  return (
    <AppShell activeTab="dashboard">
      <div className="flex flex-col gap-6">

        {/* Top Section: Overview & 4 Cards */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-black text-white tracking-tighter leading-none">Administrative Overview</h3>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mt-2">Real-time system telemetry</p>
            </div>
            <Badge className="bg-primary/20 text-white border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
              Terminal A-1
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <StatCard title="Classes" value={stats?.totalClasses ?? "—"} icon={GraduationCap} iconColor="text-secondary" />
            <StatCard title="Term" value={stats?.currentYear ?? "—"} icon={Clock} iconColor="text-cyan-500" />
            <StatCard title="Growth" value={stats?.totalStudents ? "+12.4%" : "—"} icon={TrendingUp} iconColor="text-emerald-500" />
            <StatCard title="Total Students" value={stats?.totalStudents ?? "—"} icon={Users} iconColor="text-secondary" />
          </div>
        </div>

        {/* Middle Section: Area Chart (Left) + Profile Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-stretch">
          <AnalyticsChart
            data={analyticsData}
            title="Student Enrollment Distribution"
            height={360}
            standalone
            totalStudents={stats?.totalStudents ?? 0}
          />
          <div className="h-full">
            <ProfileSummary />
          </div>
        </div>

        {/* Bottom Section: Activity List & Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-stretch">
          <div className="flex flex-col h-full">
            <ActivityList />
          </div>
          
          <div className="flex flex-col gap-6">
            <Schedule />
            <div className="glass-card border border-white/10 p-10 text-white flex flex-col justify-between shadow-none min-h-[220px]">
              <div>
                <h4 className="text-xl font-black tracking-tighter mb-2 text-white">Academic Calendar</h4>
                <p className="text-xs text-white/60 font-medium leading-relaxed uppercase tracking-widest">School events timeline</p>
              </div>
              <button className="bg-white/10 hover:bg-white/20 transition-all py-3 rounded-2xl text-xs font-black uppercase tracking-widest backdrop-blur-md border border-white/10 mt-4">
                Open Calendar
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
};
