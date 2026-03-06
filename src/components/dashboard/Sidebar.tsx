import { LayoutDashboard, Users, BookOpen, FileText, BarChart3, Settings, GraduationCap, CalendarDays, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isTeacher, isLoading: rolesLoading } = useUserRoles();
  const { signOut } = useAuth();

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["all"] },
    { id: "students", icon: GraduationCap, label: "Students", path: "/admin?tab=students", roles: ["admin"] },
    { id: "gradebook", icon: BookOpen, label: "Gradebook", path: "/gradebook", roles: ["teacher", "admin"] },
    { id: "reports", icon: FileText, label: "Reports", path: "/reports", roles: ["teacher", "admin"] },
    { id: "analytics", icon: BarChart3, label: "Analytics", path: "/analytics", roles: ["teacher", "admin"] },
    { id: "schedule", icon: CalendarDays, label: "Schedule", path: "/schedule", roles: ["all"] },
    { id: "settings", icon: Settings, label: "Settings", path: "/admin", roles: ["admin"] },
  ];

  const canAccess = (roles: string[]) => {
    if (rolesLoading) return roles.includes("all");
    if (roles.includes("all")) return true;
    if (roles.includes("admin") && isAdmin) return true;
    if (roles.includes("teacher") && (isTeacher || isAdmin)) return true;
    return false;
  };

  const isActive = (item: typeof menuItems[0]) => {
    if (item.path.includes("?")) {
      return location.pathname + location.search === item.path;
    }
    return location.pathname === item.path;
  };

  const handleClick = (item: typeof menuItems[0]) => {
    onTabChange?.(item.id);
    navigate(item.path);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-gradient-to-b from-[hsl(170,35%,25%)] via-[hsl(170,30%,22%)] to-[hsl(170,35%,20%)] rounded-r-3xl flex flex-col items-center py-5 shadow-2xl backdrop-blur-md z-50">
      {/* Logo */}
      <div className="mb-6">
        <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col items-center gap-3">
        {menuItems.filter(item => canAccess(item.roles)).map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              title={item.label}
              className={`relative p-3 rounded-xl transition-all duration-300 group ${
                active
                  ? "bg-white/20 text-white shadow-lg"
                  : "text-[hsl(170,30%,70%)] hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon size={20} />
              <div className="absolute left-full ml-2 px-2 py-1 bg-[hsl(170,30%,20%)]/90 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Sign Out */}
      <button
        onClick={signOut}
        title="Sign Out"
        className="p-3 rounded-xl transition-all duration-300 text-[hsl(170,30%,70%)] hover:text-white hover:bg-white/10 group relative"
      >
        <LogOut size={20} />
        <div className="absolute left-full ml-2 px-2 py-1 bg-[hsl(170,30%,20%)]/90 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Sign Out
        </div>
      </button>
    </aside>
  );
};
