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
    <nav className={`fixed top-0 right-0 h-16 z-40 bg-white/60 backdrop-blur-md border-b border-[hsl(170,25%,90%)]/40 flex items-center justify-between px-5 shadow-sm transition-all duration-300 ${sidebarCollapsed ? "left-20" : "left-56"}`}>
      {/* Search Bar */}
      <div className={`relative w-56 transition-all duration-300 ${searchFocus ? "ring-1 ring-[hsl(170,50%,60%)]/40" : ""} rounded-xl`}>
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
        <input
          type="text"
          placeholder="Search"
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          className="w-full pl-8 pr-3 py-2 rounded-xl bg-[hsl(170,20%,96%)] border border-[hsl(170,20%,90%)]/40 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-all"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full hover:bg-[hsl(170,20%,95%)] transition-colors">
          <Mail className="text-gray-500 size-4" />
        </button>
        <button className="relative p-2 rounded-full hover:bg-[hsl(170,20%,95%)] transition-colors">
          <Bell className="text-gray-500 size-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-400 rounded-full" />
        </button>

        <div className="w-px h-5 bg-gray-200" />

        <div className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-[hsl(170,20%,96%)] transition-colors cursor-pointer group">
          <p className="text-xs font-semibold text-gray-800">{userName}</p>
          <img
            src={userAvatar}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover border border-[hsl(170,25%,85%)]"
          />
          <ChevronDown className="text-gray-400 size-3.5 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </nav>
  );
};
