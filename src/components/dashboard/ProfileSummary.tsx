import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Users } from "lucide-react";

export const ProfileSummary = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["admin-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-profile-stats"],
    queryFn: async () => {
      const { data: students, error } = await supabase
        .from("students")
        .select("gender");
      if (error) throw error;
      const total = students?.length || 0;
      const male = students?.filter(s => s.gender?.toLowerCase() === "male").length || 0;
      const female = students?.filter(s => s.gender?.toLowerCase() === "female").length || 0;
      return { total, male, female };
    },
  });

  const totalStudents = stats?.total || 0;
  const maleCount = stats?.male || 0;
  const femaleCount = stats?.female || 0;
  const malePercent = totalStudents > 0 ? Math.round((maleCount / totalStudents) * 100) : 0;
  const femalePercent = totalStudents > 0 ? Math.round((femaleCount / totalStudents) * 100) : 0;

  const adminName = profile?.full_name || user?.email?.split("@")[0] || "Admin";
  const initials = adminName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const fillPercent = totalStudents > 0 ? Math.min(100, malePercent + femalePercent) : 0;

  return (
    <div 
      className="flex flex-col items-center justify-between p-5 md:p-6 rounded-[20px] h-full"
      style={{
        background: 'hsl(220, 20%, 96%)',
        boxShadow: '8px 8px 16px hsl(220, 20%, 88%), -8px -8px 16px hsl(0, 0%, 100%)'
      }}
    >
      {/* Top Area: Pill status + Profile */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gap-2">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={adminName} className="w-10 h-10 rounded-full object-cover shadow-sm" />
          ) : (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 font-black text-xs tracking-wider"
              style={{
                background: 'hsl(220, 20%, 96%)',
                boxShadow: '4px 4px 8px hsl(220, 20%, 88%), -4px -4px 8px hsl(0, 0%, 100%)'
              }}
            >
              {initials}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-black text-gray-700 leading-tight tracking-tight">{adminName}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Admin</span>
          </div>
        </div>
        <div 
          className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{
            background: 'hsl(220, 20%, 96%)',
            boxShadow: 'inset 2px 2px 4px hsl(220, 20%, 88%), inset -2px -2px 4px hsl(0, 0%, 100%)'
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Active</span>
        </div>
      </div>

      {/* Center Area: Donut Chart */}
      <div 
        className="relative w-[120px] h-[120px] flex items-center justify-center rounded-full my-2"
        style={{
          background: 'hsl(220, 20%, 96%)',
          boxShadow: 'inset 6px 6px 12px hsl(220, 20%, 88%), inset -6px -6px 12px hsl(0, 0%, 100%)'
        }}
      >
        <svg
          className="absolute inset-0 -rotate-90 w-full h-full drop-shadow-sm"
          viewBox="0 0 120 120"
        >
          <circle 
            cx="60" cy="60" r="46" 
            fill="none" 
            stroke="hsl(220, 20%, 90%)" 
            strokeWidth="10" 
          />
          <circle
            cx="60" cy="60" r="46"
            fill="none"
            stroke="url(#neumorphicGradient)"
            strokeWidth="10"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={(2 * Math.PI * 46) - (fillPercent / 100) * (2 * Math.PI * 46)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
          <defs>
            <linearGradient id="neumorphicGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(210, 100%, 65%)" />
              <stop offset="100%" stopColor="hsl(280, 80%, 65%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
           <span className="text-3xl font-black text-gray-700 leading-none">{totalStudents}</span>
           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total</span>
        </div>
      </div>

      {/* Bottom Area: Info rows horizontally spaced */}
      <div className="w-full flex items-center justify-between px-2 mt-4">
        <div className="flex flex-col items-center flex-1">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
            style={{
              background: 'hsl(220, 20%, 96%)',
              boxShadow: '4px 4px 8px hsl(220, 20%, 88%), -4px -4px 8px hsl(0, 0%, 100%)'
            }}
          >
            <User className="size-4 text-[hsl(210,100%,65%)]" />
          </div>
          <span className="text-xs font-black text-gray-700">{maleCount}</span>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Male</span>
        </div>
        
        <div className="h-10 w-px bg-gray-200/60" />
        
        <div className="flex flex-col items-center flex-1">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
            style={{
              background: 'hsl(220, 20%, 96%)',
              boxShadow: '4px 4px 8px hsl(220, 20%, 88%), -4px -4px 8px hsl(0, 0%, 100%)'
            }}
          >
            <User className="size-4 text-[hsl(280,80%,65%)]" />
          </div>
          <span className="text-xs font-black text-gray-700">{femaleCount}</span>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Female</span>
        </div>
      </div>
    </div>
  );
};
