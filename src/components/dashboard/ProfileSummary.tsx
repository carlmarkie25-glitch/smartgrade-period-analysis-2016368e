import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const fillPercent = totalStudents > 0 ? Math.min(100, malePercent + femalePercent) : 0;
  const offset = circumference - (fillPercent / 100) * circumference;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning!" : hour < 17 ? "Good Afternoon!" : "Good Evening!";

  return (
    <div className="bg-gradient-to-br from-[hsl(170,30%,97%)] to-[hsl(160,25%,94%)] rounded-2xl backdrop-blur-md border border-[hsl(170,30%,85%)]/30 p-3 shadow-sm flex flex-col items-center justify-center text-center">
      {/* Circular Progress with avatar */}
      <div className="relative w-[90px] h-[90px] mb-1">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 90 90"
          style={{ width: "100%", height: "100%" }}
        >
          <circle cx="45" cy="45" r={radius} fill="none" stroke="hsl(170,30%,90%)" strokeWidth="3" opacity={0.5} />
          <circle
            cx="45"
            cy="45"
            r={radius}
            fill="none"
            stroke="url(#profileGradient)"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
          />
          <defs>
            <linearGradient id="profileGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(170,60%,45%)" />
              <stop offset="100%" stopColor="hsl(185,70%,45%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={adminName} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm mb-0.5" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(170,50%,50%)] to-[hsl(160,50%,45%)] flex items-center justify-center text-white font-bold text-[10px] mb-0.5 border-2 border-white shadow-sm">
              {initials}
            </div>
          )}
          <span className="text-sm font-bold text-gray-900">{totalStudents}</span>
          <span className="text-[8px] font-medium text-gray-500">Students</span>
        </div>
      </div>

      {/* Greeting + Info */}
      <p className="text-[10px] font-medium text-gray-400 mb-0.5">{greeting}</p>
      <h3 className="text-sm font-bold text-gray-900">{adminName}</h3>
      <p className="text-[10px] font-medium text-[hsl(170,50%,40%)]">Administrator</p>

      {/* Gender indicators with counts */}
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[hsl(210,60%,55%)]" />
          <span className="text-[9px] text-gray-500">Male {maleCount} ({malePercent}%)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[hsl(330,50%,60%)]" />
          <span className="text-[9px] text-gray-500">Female {femaleCount} ({femalePercent}%)</span>
        </div>
      </div>
    </div>
  );
};
