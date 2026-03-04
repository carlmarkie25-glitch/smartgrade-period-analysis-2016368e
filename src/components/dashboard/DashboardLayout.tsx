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
      {/* Sidebar */}
      <Sidebar />

      {/* Top Navigation */}
      <Topbar />

      {/* Main Content */}
      <main className="pt-24 pl-32 pr-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Section A: Overview Stats + Profile Summary (Single Row) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Enrollment grouping card - Left 2 columns */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-teal-200/30 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Enrollment 2026
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Total Students"
                    value="1215"
                    icon={Users}
                    trend={{ value: 12, isPositive: true }}
                    backgroundColor="bg-blue-50/60"
                    iconBackgroundColor="bg-blue-100/60"
                    iconColor="text-blue-600"
                  />
                  <StatCard
                    title="Active Teachers"
                    value="345"
                    icon={BookOpen}
                    trend={{ value: 8, isPositive: true }}
                    backgroundColor="bg-emerald-50/60"
                    iconBackgroundColor="bg-emerald-100/60"
                    iconColor="text-emerald-600"
                  />
                  <StatCard
                    title="Classes Running"
                    value="93"
                    icon={School}
                    trend={{ value: 3, isPositive: true }}
                    backgroundColor="bg-purple-50/60"
                    iconBackgroundColor="bg-purple-100/60"
                    iconColor="text-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Profile Summary - Right 1 column */}
            <div className="lg:col-span-1">
              <ProfileSummary
                adminName="Dr. John Jacob"
                role="School Principal"
                totalStudents={784}
                studentPercentage={92}
              />
            </div>
          </div>

          {/* Section B & C: Analytics + Activities (Two Column Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analytics Chart wrapped card - Left 2 columns */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-teal-200/30 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Booking Rate
                </h3>
                <AnalyticsChart data={analyticsData} height={260} />
              </div>
            </div>

            {/* Today's Activities - Right 1 column */}
            <div className="lg:col-span-1">
              <ActivityList />
            </div>
          </div>

          {/* Section D & E: Schedule + Empty (maintain balance) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schedule - Left 2 columns */}
            <div className="lg:col-span-2">
              <Schedule />
            </div>

            {/* Empty space or additional card - Right 1 column */}
            <div className="lg:col-span-1">
              {/* Placeholder for future content or additional stats */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
