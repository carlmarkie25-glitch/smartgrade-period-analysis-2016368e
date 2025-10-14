import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, TrendingUp, FileText } from "lucide-react";

const Dashboard = () => {
  const stats = [
    { icon: Users, label: "Total Students", value: "1,247", change: "+12%" },
    { icon: BookOpen, label: "Active Classes", value: "42", change: "+3%" },
    { icon: GraduationCap, label: "Current Period", value: "P3", change: "50% Complete" },
    { icon: TrendingUp, label: "Pass Rate", value: "87%", change: "+5%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your school overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
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
                  <p className="text-xs text-success mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
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
                  { label: "Enter Grades", icon: BookOpen },
                  { label: "Generate Report", icon: FileText },
                  { label: "View Rankings", icon: TrendingUp },
                  { label: "Manage Students", icon: Users },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
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
      </main>
    </div>
  );
};

export default Dashboard;
