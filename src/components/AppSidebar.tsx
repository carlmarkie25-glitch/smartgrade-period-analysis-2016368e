import { useState } from "react";
import { LayoutDashboard, BookOpen, FileText, BarChart3, Settings, LogOut, CalendarDays, Calendar, ClipboardList, ChevronDown, CreditCard, UserCheck, Archive, RefreshCw } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const AppSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin, isTeacher, isVpi, isRegistrar, isLoading: rolesLoading } = useUserRoles();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;
  const isAcademicsActive = isActive("/gradebook") || isActive("/reports") || isActive("/attendance");

  const [academicsOpen, setAcademicsOpen] = useState(isAcademicsActive);

  const canAccess = (roles: string[]) => {
    if (rolesLoading) return roles.includes("all");
    if (roles.includes("all")) return true;
    if (roles.includes("admin") && isAdmin) return true;
    if (roles.includes("teacher") && (isTeacher || isAdmin || isVpi)) return true;
    return false;
  };

  const mainItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["all"] },
    { path: "/schedule", icon: CalendarDays, label: "Schedule", roles: ["all"] },
    { path: "/academic-calendar", icon: Calendar, label: "Calendar", roles: ["all"] },
    { path: "/sync-status", icon: RefreshCw, label: "Sync", roles: ["all"] },
  ];

  const academicsItems = [
    { path: "/gradebook", icon: BookOpen, label: "Gradebook" },
    { path: "/attendance", icon: UserCheck, label: "Attendance" },
    { path: "/reports", icon: FileText, label: "Reports" },
  ];

  const adminItems = [
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    ...(isAdmin ? [{ path: "/student-lifecycle", icon: Archive, label: "Lifecycle" }] : []),
    { path: "/admin", icon: Settings, label: "Settings" },
    ...(isAdmin ? [{ path: "/settings/billing", icon: CreditCard, label: "Billing" }] : []),
  ];

  const isAdminActive = isActive("/analytics") || isActive("/admin") || isActive("/settings/billing") || isActive("/student-lifecycle");
  const [adminOpen, setAdminOpen] = useState(isAdminActive);

  const renderMenuItem = (item: { path: string; icon: any; label: string }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          asChild
          className={cn(
            "mx-2 my-0.5 rounded-full transition-all duration-300 h-11 w-auto",
            active
              ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
              : "text-sidebar-foreground/90 hover:bg-white/15 hover:text-sidebar-foreground"
          )}
        >
          <Link to={item.path} className="flex items-center gap-3 px-4">
            <Icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="text-sm">{item.label}</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r-0 bg-sidebar">
      <SidebarHeader className="bg-transparent p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-14 w-14 rounded-xl object-contain" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-transparent overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider px-6">
            {!isCollapsed && "Main Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.filter(item => canAccess(item.roles)).map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Academics Group - Gradebook & Reports */}
        {!rolesLoading && (canAccess(["teacher", "admin"]) || isVpi) && (
          <SidebarGroup>
            <Collapsible open={isCollapsed ? false : academicsOpen} onOpenChange={setAcademicsOpen}>
              <CollapsibleTrigger className={cn(
                "flex items-center justify-between w-auto mx-2 my-0.5 px-4 h-11 rounded-full transition-all duration-300",
                isAcademicsActive
                  ? "text-sidebar-foreground font-semibold"
                  : "text-sidebar-foreground/90 hover:bg-white/15 hover:text-sidebar-foreground"
              )}>
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5" />
                  {!isCollapsed && <span className="text-sm">Academics</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    academicsOpen ? "rotate-180" : ""
                  )} />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <SidebarGroupContent>
                  <SidebarMenu className="pl-3">
                    {academicsItems.map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Administration */}
        {!rolesLoading && (isAdmin || isTeacher || isVpi || isRegistrar) && (
          <SidebarGroup>
            <Collapsible open={isCollapsed ? false : adminOpen} onOpenChange={setAdminOpen}>
              <CollapsibleTrigger className={cn(
                "flex items-center justify-between w-auto mx-2 my-0.5 px-4 h-11 rounded-full transition-all duration-300",
                isAdminActive
                  ? "text-sidebar-foreground font-semibold"
                  : "text-sidebar-foreground/90 hover:bg-white/15 hover:text-sidebar-foreground"
              )}>
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  {!isCollapsed && <span className="text-sm">Administration</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    adminOpen ? "rotate-180" : ""
                  )} />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <SidebarGroupContent>
                  <SidebarMenu className="pl-3">
                    {adminItems.map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-transparent p-4 space-y-2">
        <div className="flex items-center justify-between px-3 py-2 rounded-full bg-white/15">
          {!isCollapsed && <span className="text-sm font-medium text-sidebar-foreground">Theme</span>}
          <ThemeToggle />
        </div>
        <button
          onClick={signOut}
          className={cn(
            "flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full",
            "bg-white/20 text-sidebar-foreground hover:bg-white/30",
            "transition-all duration-300 font-medium text-sm"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
