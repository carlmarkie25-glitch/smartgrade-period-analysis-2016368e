import { LayoutDashboard, Users, BookOpen, FileText, BarChart3, Settings, GraduationCap, CalendarDays, LogOut, UserCog, Calendar, Building, School, Layers, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

type MenuItem = {
  id: string;
  icon: any;
  label: string;
  path: string;
  roles: string[];
};

type MenuGroup = {
  id: string;
  icon: any;
  label: string;
  roles: string[];
  children: MenuItem[];
};

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isTeacher, isLoading: rolesLoading } = useUserRoles();
  const { signOut } = useAuth();

  const topItems: MenuItem[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["all"] },
    { id: "schedule", icon: CalendarDays, label: "Schedule", path: "/schedule", roles: ["all"] },
    { id: "calendar", icon: Calendar, label: "Calendar", path: "/academic-calendar", roles: ["all"] },
  ];

  const academicsGroup: MenuGroup = {
    id: "academics",
    icon: BookOpen,
    label: "Academics",
    roles: ["teacher", "admin"],
    children: [
      { id: "gradebook", icon: BookOpen, label: "Gradebook", path: "/gradebook", roles: ["teacher", "admin"] },
      { id: "reports", icon: FileText, label: "Reports", path: "/reports", roles: ["teacher", "admin"] },
      { id: "classes", icon: Building, label: "Classes", path: "/classes", roles: ["admin"] },
      { id: "subjects", icon: Layers, label: "Subjects", path: "/subjects", roles: ["admin"] },
      { id: "years", icon: School, label: "Years", path: "/academic-years", roles: ["admin"] },
      { id: "departments", icon: Users, label: "Departments", path: "/departments", roles: ["admin"] },
    ],
  };

  const bottomItems: MenuItem[] = [
    { id: "students", icon: GraduationCap, label: "Students", path: "/students", roles: ["admin"] },
    { id: "teachers", icon: UserCog, label: "Teachers", path: "/teachers", roles: ["admin"] },
    { id: "parents", icon: Users, label: "Parents", path: "/parents", roles: ["admin"] },
    { id: "analytics", icon: BarChart3, label: "Analytics", path: "/analytics", roles: ["teacher", "admin"] },
    { id: "settings", icon: Settings, label: "Settings", path: "/admin", roles: ["admin"] },
  ];

  const academicsChildIds = academicsGroup.children.map((c) => c.id);
  const isAcademicsActive = academicsChildIds.some(
    (id) => activeTab === id || academicsGroup.children.find((c) => c.id === id)?.path === location.pathname
  );

  const [academicsOpen, setAcademicsOpen] = useState(isAcademicsActive);

  const canAccess = (roles: string[]) => {
    if (rolesLoading) return roles.includes("all");
    if (roles.includes("all")) return true;
    if (roles.includes("admin") && isAdmin) return true;
    if (roles.includes("teacher") && (isTeacher || isAdmin)) return true;
    return false;
  };

  const isActive = (item: MenuItem) => {
    return location.pathname === item.path;
  };

  const handleClick = (item: MenuItem) => {
    onTabChange?.(item.id);
    navigate(item.path);
  };

  const renderItem = (item: MenuItem, size: number = 20) => {
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
        <Icon size={size} />
        <div className="absolute left-full ml-2 px-2 py-1 bg-[hsl(170,30%,20%)]/90 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {item.label}
        </div>
      </button>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-gradient-to-b from-[hsl(170,35%,25%)] via-[hsl(170,30%,22%)] to-[hsl(170,35%,20%)] rounded-r-3xl flex flex-col items-center py-5 shadow-2xl backdrop-blur-md z-50">
      {/* Logo */}
      <div className="mb-6">
        <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto scrollbar-none">
        {topItems.filter((item) => canAccess(item.roles)).map((item) => renderItem(item))}

        {/* Academics Group */}
        {canAccess(academicsGroup.roles) && (
          <div className="flex flex-col items-center">
            <button
              onClick={() => setAcademicsOpen(!academicsOpen)}
              title="Academics"
              className={`relative p-3 rounded-xl transition-all duration-300 group ${
                isAcademicsActive && !academicsOpen
                  ? "bg-white/20 text-white shadow-lg"
                  : isAcademicsActive
                  ? "text-white"
                  : "text-[hsl(170,30%,70%)] hover:text-white hover:bg-white/10"
              }`}
            >
              <BookOpen size={20} />
              <ChevronDown
                size={10}
                className={`absolute bottom-1 left-1/2 -translate-x-1/2 transition-transform duration-200 ${
                  academicsOpen ? "rotate-180" : ""
                }`}
              />
              <div className="absolute left-full ml-2 px-2 py-1 bg-[hsl(170,30%,20%)]/90 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Academics
              </div>
            </button>
            {academicsOpen && (
              <div className="flex flex-col items-center gap-1 mt-1 py-1 px-1 rounded-xl bg-white/5">
                {academicsGroup.children
                  .filter((item) => canAccess(item.roles))
                  .map((item) => renderItem(item, 16))}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="w-8 h-px bg-white/10 my-1" />

        {bottomItems.filter((item) => canAccess(item.roles)).map((item) => renderItem(item))}
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
