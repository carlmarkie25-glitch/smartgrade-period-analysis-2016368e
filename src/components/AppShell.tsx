import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/contexts/AuthContext";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

interface AppShellProps {
  children: React.ReactNode;
  activeTab?: string;
}

const AppShell = ({ children, activeTab }: AppShellProps) => {
  const { user, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const profileName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, hsl(170, 25%, 95%) 0%, hsl(175, 20%, 96%) 50%, hsl(170, 25%, 95%) 100%)" }}>
      <Sidebar activeTab={activeTab} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Topbar userName={profileName} userRole="Staff" userAvatar={profile?.avatar_url ?? undefined} sidebarCollapsed={collapsed} />
      <main className={`pt-[72px] pb-5 px-3 md:pr-5 md:pb-5 transition-all duration-300 ${collapsed ? "md:pl-24" : "md:pl-60"}`}>
        <EmailVerificationBanner />
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
