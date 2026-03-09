import {
  LayoutDashboard, Users, BookOpen, FileText, BarChart3, Settings,
  GraduationCap, CalendarDays, LogOut, UserCog, Calendar, Building,
  School, Layers, ChevronDown, PanelLeftClose, PanelLeft,
  UsersRound, Wallet, DollarSign, Receipt, TrendingUp, PieChart,
} from "lucide-react";
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

type MenuItem = { id: string; icon: any; label: string; path: string; roles: string[] };
type MenuGroup = { id: string; icon: any; label: string; roles: string[]; children: MenuItem[] };

export const Sidebar = ({ activeTab, onTabChange, collapsed = false, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isTeacher, isLoading: rolesLoading } = useUserRoles();
  const { signOut } = useAuth();

  const topItems: MenuItem[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["all"] },
  ];

  const academicsGroup: MenuGroup = {
    id: "academics", icon: BookOpen, label: "Academics", roles: ["teacher", "admin"],
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
    id: "users", icon: UsersRound, label: "Users", roles: ["admin"],
    children: [
      { id: "students", icon: GraduationCap, label: "Students", path: "/students", roles: ["admin"] },
      { id: "teachers", icon: UserCog, label: "Teachers", path: "/teachers", roles: ["admin"] },
      { id: "parents", icon: Users, label: "Parents", path: "/parents", roles: ["admin"] },
    ],
  };

  const financeGroup: MenuGroup = {
    id: "finance", icon: Wallet, label: "Finance", roles: ["admin"],
    children: [
      { id: "fees", icon: DollarSign, label: "Fee Management", path: "/fees", roles: ["admin"] },
      { id: "payments", icon: Receipt, label: "Payments & Billing", path: "/payments", roles: ["admin"] },
      { id: "expenses", icon: TrendingUp, label: "Expenses", path: "/expenses", roles: ["admin"] },
      { id: "finance-reports", icon: PieChart, label: "Finance Reports", path: "/finance-reports", roles: ["admin"] },
    ],
  };

  const adminGroup: MenuGroup = {
    id: "administration", icon: Settings, label: "Administration", roles: ["admin"],
    children: [
      { id: "schedule", icon: CalendarDays, label: "Schedule", path: "/schedule", roles: ["admin"] },
      { id: "calendar", icon: Calendar, label: "Calendar", path: "/academic-calendar", roles: ["admin"] },
      { id: "analytics", icon: BarChart3, label: "Analytics", path: "/analytics", roles: ["teacher", "admin"] },
    ],
  };

  const isGroupActive = (group: MenuGroup) =>
    group.children.some((c) => c.path === location.pathname);

  const [academicsOpen, setAcademicsOpen] = useState(isGroupActive(academicsGroup));
  const [usersOpen, setUsersOpen] = useState(isGroupActive(usersGroup));
  const [financeOpen, setFinanceOpen] = useState(isGroupActive(financeGroup));
  const [adminOpen, setAdminOpen] = useState(isGroupActive(adminGroup));

  const canAccess = (roles: string[]) => {
    if (rolesLoading) return roles.includes("all");
    if (roles.includes("all")) return true;
    if (roles.includes("admin") && isAdmin) return true;
    if (roles.includes("teacher") && (isTeacher || isAdmin)) return true;
    return false;
  };

  const handleClick = (item: MenuItem) => {
    onTabChange?.(item.id);
    navigate(item.path);
  };

  /* ── Shared styles ── */
  const itemBase =
    "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 relative group";
  const itemActive = "bg-white/15 text-white";
  const itemInactive = "text-white/60 hover:text-white hover:bg-white/10";
  const subItemBase = "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl transition-all duration-200";
  const subItemActive = "bg-white/12 text-white";
  const subItemInactive = "text-white/55 hover:text-white hover:bg-white/8";

  const Tooltip = ({ label }: { label: string }) =>
    collapsed ? (
      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[hsl(220,70%,8%)] text-white text-[10px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-white/10">
        {label}
      </div>
    ) : null;

  const renderItem = (item: MenuItem) => {
    const Icon = item.icon;
    const active = location.pathname === item.path;
    return (
      <button
        key={item.id}
        onClick={() => handleClick(item)}
        className={`${itemBase} ${active ? itemActive : itemInactive}`}
      >
        <Icon size={18} className="flex-shrink-0" />
        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
        <Tooltip label={item.label} />
      </button>
    );
  };

  const renderGroup = (
    group: MenuGroup,
    isOpen: boolean,
    setOpen: (v: boolean) => void
  ) => {
    if (!canAccess(group.roles)) return null;
    const GroupIcon = group.icon;
    const groupActive = isGroupActive(group);
    return (
      <div key={group.id}>
        <button
          onClick={() => setOpen(!isOpen)}
          className={`${itemBase} ${groupActive && !isOpen ? itemActive : groupActive ? "text-white" : itemInactive}`}
        >
          <GroupIcon size={18} className="flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm font-medium flex-1 text-left">{group.label}</span>
              <ChevronDown
                size={13}
                className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </>
          )}
          {collapsed && (
            <ChevronDown
              size={8}
              className={`absolute bottom-1 left-1/2 -translate-x-1/2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          )}
          <Tooltip label={group.label} />
        </button>

        {isOpen && (
          <div className={`flex flex-col gap-0.5 mt-0.5 py-1 rounded-xl bg-white/5 ${collapsed ? "px-1" : "ml-2 px-1.5"}`}>
            {group.children
              .filter((c) => canAccess(c.roles))
              .map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleClick(item)}
                    className={`${subItemBase} ${active ? subItemActive : subItemInactive} relative group`}
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    {!collapsed && <span className="text-xs font-medium">{item.label}</span>}
                    <Tooltip label={item.label} />
                  </button>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen flex flex-col py-5 z-50 transition-all duration-300 ${
        collapsed ? "w-[70px] px-2 items-center" : "w-[224px] px-3"
      }`}
      style={{
        background: "linear-gradient(180deg, hsl(220,70%,12%) 0%, hsl(220,68%,15%) 40%, hsl(220,65%,20%) 100%)",
        borderRight: "1px solid hsl(220,70%,22%)",
      }}
    >
      {/* Header */}
      <div className={`flex items-center mb-6 ${collapsed ? "justify-center" : "justify-between px-1"}`}>
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Logo" className="h-9 w-9 rounded-xl object-contain flex-shrink-0" />
          {!collapsed && (
            <span className="text-white font-bold text-base tracking-tight">SmartGrade</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto scrollbar-hide">
        {topItems.filter((i) => canAccess(i.roles)).map(renderItem)}

        <div className="my-1 h-px bg-white/10 mx-1" />

        {renderGroup(academicsGroup, academicsOpen, setAcademicsOpen)}
        {renderGroup(usersGroup, usersOpen, setUsersOpen)}
        {renderGroup(financeGroup, financeOpen, setFinanceOpen)}
        {renderGroup(adminGroup, adminOpen, setAdminOpen)}
      </div>

      {/* Settings */}
      {canAccess(["admin"]) && (
        <button
          onClick={() => navigate("/admin")}
          className={`${itemBase} mt-1 ${location.pathname === "/admin" ? itemActive : itemInactive}`}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
          <Tooltip label="Settings" />
        </button>
      )}

      {/* Sign Out */}
      <button
        onClick={signOut}
        className={`${itemBase} mt-1 text-white/50 hover:text-white hover:bg-white/10`}
      >
        <LogOut size={18} className="flex-shrink-0" />
        {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        <Tooltip label="Sign Out" />
      </button>
    </aside>
  );
};
