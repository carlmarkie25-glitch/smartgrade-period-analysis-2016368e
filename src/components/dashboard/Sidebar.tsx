import { LayoutDashboard, Users, BookOpen, FileText, BarChart3, Settings, GraduationCap, CalendarDays, LogOut, UserCog, Calendar, Building, School, Layers, ChevronDown, PanelLeftClose, PanelLeft, UsersRound, Wallet, DollarSign, Receipt, TrendingUp, PieChart, CreditCard, Archive } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
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

export const Sidebar = ({ activeTab, onTabChange, collapsed = false, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isTeacher, isLoading: rolesLoading } = useUserRoles();
  const { signOut } = useAuth();

  const topItems: MenuItem[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["all"] },
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

  const usersGroup: MenuGroup = {
    id: "users",
    icon: UsersRound,
    label: "Users",
    roles: ["admin"],
    children: [
      { id: "students", icon: GraduationCap, label: "Students", path: "/students", roles: ["admin"] },
      { id: "teachers", icon: UserCog, label: "Teachers", path: "/teachers", roles: ["admin"] },
      { id: "parents", icon: Users, label: "Parents", path: "/parents", roles: ["admin"] },
    ],
  };

  const financeGroup: MenuGroup = {
    id: "finance",
    icon: Wallet,
    label: "Finance",
    roles: ["admin"],
    children: [
      { id: "fees", icon: DollarSign, label: "Fee Management", path: "/fees", roles: ["admin"] },
      { id: "payments", icon: Receipt, label: "Payments & Billing", path: "/payments", roles: ["admin"] },
      { id: "expenses", icon: TrendingUp, label: "Expenses", path: "/expenses", roles: ["admin"] },
      { id: "finance-reports", icon: PieChart, label: "Finance Reports", path: "/finance-reports", roles: ["admin"] },
    ],
  };

  const adminGroup: MenuGroup = {
    id: "administration",
    icon: Settings,
    label: "Administration",
    roles: ["admin"],
    children: [
      { id: "schedule", icon: CalendarDays, label: "Schedule", path: "/schedule", roles: ["admin"] },
      { id: "calendar", icon: Calendar, label: "Calendar", path: "/academic-calendar", roles: ["admin"] },
      { id: "analytics", icon: BarChart3, label: "Analytics", path: "/analytics", roles: ["teacher", "admin"] },
      { id: "student-lifecycle", icon: Archive, label: "Lifecycle", path: "/student-lifecycle", roles: ["admin"] },
    ],
  };

  const academicsChildIds = academicsGroup.children.map((c) => c.id);
  const isAcademicsActive = academicsChildIds.some(
    (id) => activeTab === id || academicsGroup.children.find((c) => c.id === id)?.path === location.pathname
  );

  const usersChildIds = usersGroup.children.map((c) => c.id);
  const isUsersActive = usersChildIds.some(
    (id) => activeTab === id || usersGroup.children.find((c) => c.id === id)?.path === location.pathname
  );

  const financeChildIds = financeGroup.children.map((c) => c.id);
  const isFinanceActive = financeChildIds.some(
    (id) => activeTab === id || financeGroup.children.find((c) => c.id === id)?.path === location.pathname
  );

  const adminChildIds = adminGroup.children.map((c) => c.id);
  const isAdminActive = adminChildIds.some(
    (id) => activeTab === id || adminGroup.children.find((c) => c.id === id)?.path === location.pathname
  );

  const [academicsOpen, setAcademicsOpen] = useState(isAcademicsActive);
  const [usersOpen, setUsersOpen] = useState(isUsersActive);
  const [financeOpen, setFinanceOpen] = useState(isFinanceActive);
  const [adminOpen, setAdminOpen] = useState(isAdminActive);

  const canAccess = (roles: string[]) => {
    if (rolesLoading) return roles.includes("all");
    if (roles.includes("all")) return true;
    if (roles.includes("admin") && isAdmin) return true;
    if (roles.includes("teacher") && (isTeacher || isAdmin)) return true;
    return false;
  };

  const isActiveItem = (item: MenuItem) => {
    return location.pathname === item.path;
  };

  const handleClick = (item: MenuItem) => {
    onTabChange?.(item.id);
    navigate(item.path);
  };

  const renderItem = (item: MenuItem) => {
    const Icon = item.icon;
    const active = isActiveItem(item);
    return (
      <button
        key={item.id}
        onClick={() => handleClick(item)}
        title={item.label}
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-300 group ${
          active
            ? "bg-white/20 text-white shadow-lg"
            : "text-[hsl(170,30%,70%)] hover:text-white hover:bg-white/10"
        }`}
      >
        <Icon size={20} className="flex-shrink-0" />
        {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-[hsl(170,30%,20%)]/90 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </button>
    );
  };

  const renderGroupItem = (item: MenuItem) => {
    const Icon = item.icon;
    const active = isActiveItem(item);
    return (
      <button
        key={item.id}
        onClick={() => handleClick(item)}
        title={item.label}
        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-300 ${
          active
            ? "bg-white/15 text-white"
            : "text-[hsl(170,30%,70%)] hover:text-white hover:bg-white/10"
        }`}
      >
        <Icon size={16} className="flex-shrink-0" />
        {!collapsed && <span className="text-xs font-medium truncate">{item.label}</span>}
      </button>
    );
  };

  const renderGroup = (group: MenuGroup, isOpen: boolean, setOpen: (v: boolean) => void, isGroupActive: boolean) => {
    if (!canAccess(group.roles)) return null;
    const GroupIcon = group.icon;
    return (
      <div className="w-full" key={group.id}>
        <button
          onClick={() => setOpen(!isOpen)}
          title={group.label}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-300 group relative ${
            isGroupActive && !isOpen
              ? "bg-white/20 text-white shadow-lg"
              : isGroupActive
              ? "text-white"
              : "text-[hsl(170,30%,70%)] hover:text-white hover:bg-white/10"
          }`}
        >
          <GroupIcon size={20} className="flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm font-medium truncate flex-1 text-left">{group.label}</span>
              <ChevronDown
                size={14}
                className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </>
          )}
          {collapsed && (
            <>
              <ChevronDown
                size={10}
                className={`absolute bottom-1 left-1/2 -translate-x-1/2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
              <div className="absolute left-full ml-2 px-2 py-1 bg-[hsl(170,30%,20%)]/90 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {group.label}
              </div>
            </>
          )}
        </button>
        {isOpen && (
          <div className={`flex flex-col gap-0.5 mt-1 py-1 rounded-xl bg-white/5 ${collapsed ? "px-1" : "px-2 ml-2"}`}>
            {group.children
              .filter((item) => canAccess(item.roles))
              .map((item) => renderGroupItem(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[hsl(170,35%,25%)] via-[hsl(170,30%,22%)] to-[hsl(170,35%,20%)] rounded-r-3xl flex flex-col py-5 shadow-2xl backdrop-blur-md z-50 transition-all duration-300 ${
        collapsed ? "w-20 items-center px-2" : "w-56 px-3"
      }`}
    >
      {/* Header: Logo + Toggle */}
      <div className={`flex items-center mb-6 ${collapsed ? "justify-center" : "justify-between px-1"}`}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg object-contain flex-shrink-0" />
          {!collapsed && <span className="text-white font-bold text-lg truncate">SmartGrade</span>}
        </div>
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-lg text-[hsl(170,30%,70%)] hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
        {topItems.filter((item) => canAccess(item.roles)).map((item) => renderItem(item))}

        {renderGroup(academicsGroup, academicsOpen, setAcademicsOpen, isAcademicsActive)}
        {renderGroup(usersGroup, usersOpen, setUsersOpen, isUsersActive)}
        {renderGroup(financeGroup, financeOpen, setFinanceOpen, isFinanceActive)}
        {renderGroup(adminGroup, adminOpen, setAdminOpen, isAdminActive)}
      </div>

      {/* Settings */}
      {canAccess(["admin"]) && (
        <button
          onClick={() => navigate("/admin")}
          title="Settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative ${collapsed ? "justify-center" : ""} ${
            location.pathname === "/admin"
              ? "bg-white/20 text-white shadow-lg"
              : "text-[hsl(170,30%,70%)] hover:text-white hover:bg-white/10"
          }`}
        >
          <Settings size={20} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-[hsl(170,30%,20%)]/90 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Settings
            </div>
          )}
        </button>
      )}

      {/* Sign Out */}
      <button
        onClick={signOut}
        title="Sign Out"
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-[hsl(170,30%,70%)] hover:text-white hover:bg-white/10 group relative mt-1 ${collapsed ? "justify-center" : ""}`}
      >
        <LogOut size={20} className="flex-shrink-0" />
        {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-[hsl(170,30%,20%)]/90 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Sign Out
          </div>
        )}
      </button>
    </aside>
  );
};
