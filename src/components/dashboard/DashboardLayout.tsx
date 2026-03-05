import { Users, BookOpen, School, Clock } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { StatCard } from "./StatCard";
import { AnalyticsChart } from "./AnalyticsChart";
import { ProfileSummary } from "./ProfileSummary";
import { Schedule } from "./Schedule";
import { ActivityList } from "./ActivityList";

// Mock data for analytics
const analyticsData = [
  { month: "Jan", students: 320, capacity: 400 },
  { month: "Feb", students: 380, capacity: 400 },
  { month: "Mar", students: 420, capacity: 450 },
  { month: "Apr", students: 450, capacity: 500 },
  { month: "May", students: 520, capacity: 550 },
  { month: "Jun", students: 580, capacity: 600 },
];

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/50">
      <Sidebar />
      <Topbar />

      <main className="pt-[88px] pl-28 pr-6 pb-6">
        <div className="max-w-[1400px] mx-auto space-y-4">
          {/* Row 1: Stats + Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-teal-200/30 p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Enrollment 2026</h3>
                <span className="text-xs font-medium text-teal-600/70 px-2.5 py-1 bg-teal-50/50 rounded-lg">Weekly</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="Total Students" value="1215" icon={Users} trend={{ value: 12, isPositive: true }} backgroundColor="bg-blue-50/60" iconBackgroundColor="bg-blue-100/60" iconColor="text-blue-600" />
                <StatCard title="Active Teachers" value="345" icon={BookOpen} trend={{ value: 8, isPositive: true }} backgroundColor="bg-emerald-50/60" iconBackgroundColor="bg-emerald-100/60" iconColor="text-emerald-600" />
                <StatCard title="Classes Running" value="93" icon={School} trend={{ value: 3, isPositive: true }} backgroundColor="bg-purple-50/60" iconBackgroundColor="bg-purple-100/60" iconColor="text-purple-600" />
                <StatCard title="Pending Reviews" value="71" icon={Clock} trend={{ value: 5, isPositive: false }} backgroundColor="bg-amber-50/60" iconBackgroundColor="bg-amber-100/60" iconColor="text-amber-600" />
              </div>
            </div>
            <ProfileSummary adminName="Dr. John Jacob" role="School Principal" totalStudents={784} studentPercentage={92} />
          </div>

          {/* Row 2: Analytics + Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-teal-200/30 p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Enrollment Analytics</h3>
                <span className="text-xs font-medium text-teal-600/70 px-2.5 py-1 bg-teal-50/50 rounded-lg">Weekly</span>
              </div>
              <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
                <div className="flex-shrink-0">
                  <p className="text-4xl font-bold text-gray-900">58%</p>
                  <p className="text-sm text-gray-600 mt-1">Overall Enrollment Rate</p>
                  <p className="text-xs text-teal-600 mt-1">6% ↑ Higher than last week</p>
                </div>
                <div className="flex-1 w-full min-w-0">
                  <AnalyticsChart data={analyticsData} height={140} />
                </div>
              </div>
            </div>
            <ActivityList />
          </div>

          {/* Row 3: Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            <Schedule />
            <div />
          </div>
        </div>
      </main>
    </div>
  );
};
