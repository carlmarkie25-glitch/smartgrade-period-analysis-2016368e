import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/contexts/AuthContext";

interface AppShellProps {
  children: React.ReactNode;
  activeTab?: string;
}

const AppShell = ({ children, activeTab }: AppShellProps) => {
  const { user } = useAuth();
  
  const profileName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(170,30%,96%)] via-[hsl(175,25%,95%)] to-[hsl(185,30%,94%)]">
      <Sidebar activeTab={activeTab} />
      <Topbar userName={profileName} userRole="Staff" />
      <main className="pt-[72px] pl-24 pr-5 pb-5">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
