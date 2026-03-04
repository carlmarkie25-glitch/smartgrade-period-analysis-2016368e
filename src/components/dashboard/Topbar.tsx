import { Search, Bell, ChevronDown } from "lucide-react";
import { useState } from "react";

interface TopbarProps {
  userName?: string;
  userRole?: string;
  userAvatar?: string;
}

export const Topbar = ({
  userName = "John Jacob",
  userRole = "Principal",
  userAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
}: TopbarProps) => {
  const [searchFocus, setSearchFocus] = useState(false);

  return (
    <nav className="fixed top-0 left-24 right-0 h-20 z-50 bg-white/70 backdrop-blur-md border-b border-teal-100/20 flex items-center justify-between px-8 shadow-sm">
      {/* Search Bar */}
      <div
        className={`relative w-64 transition-all duration-300 ${searchFocus ? "ring-2 ring-teal-400/50" : ""}`}
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-400 size-5" />
        <input
          type="text"
          placeholder="Search"
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-teal-50/50 border border-teal-200/30 text-gray-700 placeholder-teal-400/60 focus:outline-none transition-all"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Notification */}
        <button className="relative p-2.5 rounded-full hover:bg-teal-50/50 transition-colors group">
          <Bell className="text-teal-600/70 size-5 group-hover:text-teal-600" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-400 rounded-full animate-pulse" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-teal-200/30" />

        {/* Profile */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-teal-50/50 transition-colors cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{userName}</p>
            <p className="text-xs text-teal-600/70 font-medium">{userRole}</p>
          </div>
          <img
            src={userAvatar}
            alt={userName}
            className="w-10 h-10 rounded-full object-cover border-2 border-teal-200/50"
          />
          <ChevronDown className="text-teal-400/60 size-4 group-hover:text-teal-600 transition-colors" />
        </div>
      </div>
    </nav>
  );
};
