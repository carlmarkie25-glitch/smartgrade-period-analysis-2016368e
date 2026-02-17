import { GraduationCap, LayoutDashboard, BookOpen, FileText, BarChart3, Settings, LogOut, Sun, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  const { signOut, user } = useAuth();
  const { isAdmin, isTeacher, isLoading: rolesLoading } = useUserRoles();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Define nav items - teachers and admins have different access
  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["all"] },
    { path: "/gradebook", icon: BookOpen, label: "Gradebook", roles: ["teacher", "admin"] },
    { path: "/reports", icon: FileText, label: "Reports", roles: ["teacher", "admin"] },
    // Analytics is admin-only
    { path: "/analytics", icon: BarChart3, label: "Analytics", roles: ["teacher", "admin"] },
  ];

  const adminItems = [
    { path: "/admin", icon: Settings, label: "Admin Panel", roles: ["admin"] },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Don't show any role-based items while roles are loading
  const canAccess = (roles: string[]) => {
    if (rolesLoading) return roles.includes("all"); // Only show "all" items while loading
    if (roles.includes("all")) return true;
    if (roles.includes("admin") && isAdmin) return true;
    if (roles.includes("teacher") && (isTeacher || isAdmin)) return true;
    return false;
  };

  return (
    <Sidebar className="border-r-0 bg-sidebar">
      <SidebarHeader className="bg-sidebar p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">SmartGrade</span>
              <span className="text-xs text-sidebar-foreground/70">School Management</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4">
            {!isCollapsed && "Main Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.filter(item => canAccess(item.roles)).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "mx-2 rounded-lg transition-all duration-200",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Link to={item.path} className="flex items-center gap-3 px-3 py-2.5">
                        <Icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Only show Administration section if user is admin and roles are loaded */}
        {!rolesLoading && isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4">
              {!isCollapsed && "Administration"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={cn(
                          "mx-2 rounded-lg transition-all duration-200",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <Link to={item.path} className="flex items-center gap-3 px-3 py-2.5">
                          <Icon className="h-5 w-5" />
                          {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-sidebar p-4 space-y-2">
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-sidebar-accent/50">
          {!isCollapsed && <span className="text-sm font-medium text-sidebar-foreground">Theme</span>}
          <ThemeToggle />
        </div>
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg",
            "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            "transition-all duration-200"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
