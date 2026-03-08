import { Users, Clock, GraduationCap } from "lucide-react";
import { StatCard } from "./StatCard";
import { AnalyticsChart } from "./AnalyticsChart";
import { ProfileSummary } from "./ProfileSummary";
import { Schedule } from "./Schedule";
import { ActivityList } from "./ActivityList";
import AppShell from "@/components/AppShell";
import { useDashboardStats } from "@/hooks/useDashboardStats";

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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3 auto-rows-max">
        {/* Row 1: Stats */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Student Overview</h3>
            <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">This Term</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 flex-1">
            <StatCard title="Total Students" value={stats?.totalStudents ?? "—"} icon={Users} backgroundColor="bg-[hsl(210,60%,96%)]" iconBackgroundColor="bg-[hsl(210,60%,90%)]" iconColor="text-[hsl(210,60%,45%)]" />
            <StatCard title="Active Classes" value={stats?.totalClasses ?? "—"} icon={GraduationCap} backgroundColor="bg-[hsl(170,45%,95%)]" iconBackgroundColor="bg-[hsl(170,45%,88%)]" iconColor="text-[hsl(170,50%,35%)]" highlighted />
            <StatCard title="Academic Year" value={stats?.currentYear ?? "—"} icon={Clock} backgroundColor="bg-[hsl(35,60%,96%)]" iconBackgroundColor="bg-[hsl(35,60%,90%)]" iconColor="text-[hsl(35,60%,40%)]" />
          </div>
        </div>

        {/* Row 1 Right: Profile Summary */}
        <ProfileSummary />

        {/* Row 2: Analytics */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Enrollment Rate</h3>
            <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">Weekly</span>
          </div>
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-3">
            <div className="flex-shrink-0">
              <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Enrolled<br/>Students</p>
            </div>
            <div className="flex-1 w-full min-w-0">
              <AnalyticsChart data={analyticsData} height={120} />
            </div>
          </div>
        </div>

        {/* Rows 2-3 Right: Activity List */}
        <div className="lg:row-span-2">
          <ActivityList />
        </div>

        {/* Row 3: Schedule */}
        <Schedule />
      </div>
    </AppShell>
  );
};
