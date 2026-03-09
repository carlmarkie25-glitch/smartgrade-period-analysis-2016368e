import { Search, Bell, Mail, ChevronDown } from "lucide-react";
import { useState } from "react";

interface TopbarProps {
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  sidebarCollapsed?: boolean;
}

export const Topbar = ({
  userName = "Dr. John Jacob",
  userRole = "Principal",
  userAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
  sidebarCollapsed = false,
}: TopbarProps) => {
  const [searchFocus, setSearchFocus] = useState(false);

  return (
    <nav
      className={`fixed top-0 right-0 h-16 z-40 flex items-center justify-between px-5 transition-all duration-300 bg-card/80 backdrop-blur-lg border-b border-border/60 ${
        sidebarCollapsed ? "left-[70px]" : "left-[224px]"
      }`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* Search */}
      <div className={`relative w-56 transition-all duration-200 ${searchFocus ? "ring-1 ring-primary/30" : ""} rounded-xl`}>
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <input
          type="text"
          placeholder="Search"
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          className="w-full pl-8 pr-3 py-2 rounded-xl bg-muted/60 border border-border/50 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:bg-card transition-all"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
          <Mail className="text-muted-foreground size-4" />
        </button>
        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
          <Bell className="text-muted-foreground size-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning rounded-full" />
        </button>

        <div className="w-px h-5 bg-border" />

        <div className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-muted transition-colors cursor-pointer group">
          <p className="text-xs font-semibold text-foreground">{userName}</p>
          <img
            src={userAvatar}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover border border-border"
          />
          <ChevronDown className="text-muted-foreground size-3.5 group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </nav>
  );
};
