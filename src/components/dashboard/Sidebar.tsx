import { LayoutDashboard, Users, BookOpen, Building2, Wallet, Settings } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Sidebar = ({ activeTab = "dashboard", onTabChange }: SidebarProps) => {
  const [active, setActive] = useState(activeTab);

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "students", icon: Users, label: "Students" },
    { id: "teachers", icon: BookOpen, label: "Teachers" },
    { id: "classes", icon: Building2, label: "Classes" },
    { id: "finance", icon: Wallet, label: "Finance" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const handleClick = (id: string) => {
    setActive(id);
    onTabChange?.(id);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-24 bg-gradient-to-b from-teal-900/90 via-teal-800/85 to-teal-900/90 rounded-r-3xl flex flex-col items-center justify-center gap-8 shadow-2xl backdrop-blur-md">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            title={item.label}
            className={`relative p-4 rounded-2xl transition-all duration-300 group ${
              isActive
                ? "bg-white/20 text-white shadow-lg"
                : "text-teal-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon size={24} />
            <div className="absolute left-full ml-2 px-3 py-1 bg-teal-700/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {item.label}
            </div>
          </button>
        );
      })}
    </aside>
  );
};
