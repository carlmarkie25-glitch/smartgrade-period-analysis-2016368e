import { Users, Clock, GraduationCap, TrendingUp } from "lucide-react";
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
      <div className="flex flex-col gap-6">
        
        {/* Main Neumorphic Container */}
        <div 
          className="rounded-[28px] p-6 md:p-8"
          style={{
            background: 'hsl(220, 20%, 96%)',
            boxShadow: '12px 12px 24px hsl(220, 20%, 86%), -12px -12px 24px hsl(0, 0%, 100%)'
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 items-center">
            
            {/* LEFT SIDE: Stats Row */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-black text-gray-700 tracking-tight">Overview</h3>
                <div 
                  className="px-4 py-1.5 rounded-full flex items-center"
                  style={{
                    background: 'hsl(220, 20%, 96%)',
                    boxShadow: 'inset 3px 3px 6px hsl(220, 20%, 88%), inset -3px -3px 6px hsl(0, 0%, 100%)'
                  }}
                >
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">This Term</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                <StatCard 
                  title="Students" 
                  value={stats?.totalStudents ?? "—"} 
                  icon={Users} 
                  iconColor="text-blue-400" 
                />
                <StatCard 
                  title="Classes" 
                  value={stats?.totalClasses ?? "—"} 
                  icon={GraduationCap} 
                  iconColor="text-purple-400" 
                />
                <StatCard 
                  title="Year" 
                  value={stats?.currentYear ?? "—"} 
                  icon={Clock} 
                  iconColor="text-amber-400" 
                />
                <StatCard 
                  title="Enrollment" 
                  value={stats?.totalStudents ? "+12%" : "—"} 
                  icon={TrendingUp} 
                  iconColor="text-emerald-400" 
                />
              </div>
            </div>

            {/* RIGHT SIDE: Profile Summary */}
            <div className="h-full mt-4 lg:mt-0">
              <ProfileSummary />
            </div>

          </div>
        </div>

        {/* Existing Lower Sections Container */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 auto-rows-max">
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
      </div>
    </AppShell>
  );
};
