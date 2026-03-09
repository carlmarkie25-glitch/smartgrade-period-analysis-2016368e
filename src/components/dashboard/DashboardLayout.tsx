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
      <div className="flex flex-col gap-5">

        {/* ── Overview Card ── */}
        <div
          className="rounded-[22px] p-6 md:p-7 bg-card border border-border/60"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 items-stretch">

            {/* LEFT: Stats */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Overview</h3>
                <span className="text-[10px] font-semibold text-muted-foreground px-3 py-1 bg-muted rounded-full border border-border/50 uppercase tracking-widest">
                  This Term
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  title="Students"
                  value={stats?.totalStudents ?? "—"}
                  icon={Users}
                  iconColor="text-blue-500"
                />
                <StatCard
                  title="Classes"
                  value={stats?.totalClasses ?? "—"}
                  icon={GraduationCap}
                  iconColor="text-violet-500"
                />
                <StatCard
                  title="Year"
                  value={stats?.currentYear ?? "—"}
                  icon={Clock}
                  iconColor="text-amber-500"
                />
                <StatCard
                  title="Enrollment"
                  value={stats?.totalStudents ? "+12%" : "—"}
                  icon={TrendingUp}
                  iconColor="text-emerald-500"
                />
              </div>
            </div>

            {/* RIGHT: Profile */}
            <div className="mt-0">
              <ProfileSummary />
            </div>
          </div>
        </div>

        {/* ── Lower Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 auto-rows-max">
          <AnalyticsChart
            data={analyticsData}
            title="Enrollment Rate"
            height={140}
            standalone
            totalStudents={stats?.totalStudents ?? 0}
          />

          <div className="lg:row-span-2">
            <ActivityList />
          </div>

          <Schedule />
        </div>
      </div>
    </AppShell>
  );
};
