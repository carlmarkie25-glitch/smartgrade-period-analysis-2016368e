import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, FileText, BarChart3 } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatarMenu from "@/components/UserAvatarMenu";

const Navbar = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const profileName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/gradebook", icon: BookOpen, label: "Gradebook" },
    { path: "/reports", icon: FileText, label: "Reports" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-12 w-12 object-contain" />
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <UserAvatarMenu userName={profileName} avatarUrl={profile?.avatar_url ?? undefined} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
