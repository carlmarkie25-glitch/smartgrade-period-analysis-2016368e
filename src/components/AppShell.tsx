import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/contexts/AuthContext";

interface AppShellProps {
  children: React.ReactNode;
  activeTab?: string;
}

const AppShell = ({ children, activeTab }: AppShellProps) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const profileName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, hsl(170, 25%, 95%) 0%, hsl(175, 20%, 96%) 50%, hsl(170, 25%, 95%) 100%)" }}>
      <Sidebar activeTab={activeTab} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Topbar userName={profileName} userRole="Staff" sidebarCollapsed={collapsed} />
      <main className={`pt-[72px] pr-5 pb-5 transition-all duration-300 ${collapsed ? "pl-24" : "pl-60"}`}>
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
