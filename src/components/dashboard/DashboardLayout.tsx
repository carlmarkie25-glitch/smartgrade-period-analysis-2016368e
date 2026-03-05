import { Users, BookOpen, Clock } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { StatCard } from "./StatCard";
import { AnalyticsChart } from "./AnalyticsChart";
import { ProfileSummary } from "./ProfileSummary";
import { Schedule } from "./Schedule";
import { ActivityList } from "./ActivityList";

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(170,30%,96%)] via-[hsl(175,25%,95%)] to-[hsl(185,30%,94%)]">
      <Sidebar />
      <Topbar />

      <main className="pt-[84px] pl-[104px] pr-5 pb-5">
        <div className="max-w-[1400px] mx-auto">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3 auto-rows-max lg:auto-rows-auto">
            {/* Row 1: Stats */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Incoming Student History</h3>
                <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">Weekly</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                <StatCard title="Consultation" value="1215" icon={Users} trend={{ value: 12, isPositive: true }} backgroundColor="bg-[hsl(210,60%,96%)]" iconBackgroundColor="bg-[hsl(210,60%,90%)]" iconColor="text-[hsl(210,60%,45%)]" />
                <StatCard title="In Progress" value="345" icon={BookOpen} trend={{ value: 8, isPositive: true }} backgroundColor="bg-[hsl(170,45%,95%)]" iconBackgroundColor="bg-[hsl(170,45%,88%)]" iconColor="text-[hsl(170,50%,35%)]" highlighted />
                <StatCard title="In Pending" value="71" icon={Clock} trend={{ value: 5, isPositive: false }} backgroundColor="bg-[hsl(35,60%,96%)]" iconBackgroundColor="bg-[hsl(35,60%,90%)]" iconColor="text-[hsl(35,60%,40%)]" />
              </div>
            </div>

            {/* Row 1 Right: Profile Summary */}
            <ProfileSummary adminName="Dr. John Jacob" role="Orthodontist" totalStudents={784} studentPercentage={92} />

            {/* Row 2: Analytics */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Booking Rate</h3>
                <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">Weekly</span>
              </div>
              <div className="flex flex-col lg:flex-row items-start lg:items-end gap-3">
                <div className="flex-shrink-0">
                  <p className="text-3xl font-bold text-gray-900">58%</p>
                  <p className="text-xs text-gray-500 mt-0.5">Your Total Patient<br/>on Friday</p>
                  <p className="text-[10px] text-[hsl(170,60%,35%)] mt-1 flex items-center gap-1">
                    <span className="font-bold text-[hsl(170,60%,35%)]">6% ↑</span>
                    <span className="text-gray-400">Your booking rate is 6% higher than yesterday</span>
                  </p>
                </div>
                <div className="flex-1 w-full min-w-0">
                  <AnalyticsChart data={analyticsData} height={120} />
                </div>
              </div>
            </div>

            {/* Rows 2-3 Right: Activity List Spanning */}
            <div className="lg:row-span-2">
              <ActivityList />
            </div>

            {/* Row 3: Schedule */}
            <Schedule />
          </div>
        </div>
      </main>
    </div>
  );
};
