import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

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
      const { data: students, error } = await supabase.from("students").select("gender");
      if (error) throw error;
      const total = students?.length || 0;
      const male = students?.filter((s) => s.gender?.toLowerCase() === "male").length || 0;
      const female = students?.filter((s) => s.gender?.toLowerCase() === "female").length || 0;
      return { total, male, female };
    },
  });

  const totalStudents = stats?.total || 0;
  const maleCount = stats?.male || 0;
  const femaleCount = stats?.female || 0;
  const malePercent = totalStudents > 0 ? Math.round((maleCount / totalStudents) * 100) : 0;
  const femalePercent = totalStudents > 0 ? Math.round((femaleCount / totalStudents) * 100) : 0;
  const fillPercent = totalStudents > 0 ? Math.min(100, malePercent + femalePercent) : 0;

  const adminName = profile?.full_name || user?.email?.split("@")[0] || "Admin";
  const initials = adminName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="flex flex-col items-center justify-between p-5 md:p-6 rounded-[22px] h-full bg-card border border-border/60"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* Top: Profile + Status */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gap-2.5">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={adminName}
              className="w-9 h-9 rounded-full object-cover border border-border/60"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-primary-foreground"
              style={{
                background: "linear-gradient(135deg, hsl(220,70%,35%), hsl(220,70%,22%))",
              }}
            >
              {initials}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground leading-tight">{adminName}</span>
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
              Admin
            </span>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-full flex items-center gap-1.5 bg-success/10 border border-success/20">
          <div className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-[9px] font-semibold text-success uppercase tracking-widest">Active</span>
        </div>
      </div>

      {/* Center: Donut Chart */}
      <div className="relative w-[116px] h-[116px] flex items-center justify-center my-2">
        <svg
          className="absolute inset-0 -rotate-90 w-full h-full"
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="hsl(220,13%,91%)"
            strokeWidth="9"
          />
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="url(#donutGradient)"
            strokeWidth="9"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={
              (2 * Math.PI * 46) - (fillPercent / 100) * (2 * Math.PI * 46)
            }
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
          <defs>
            <linearGradient id="donutGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(220,70%,40%)" />
              <stop offset="100%" stopColor="hsl(220,70%,60%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground leading-none">{totalStudents}</span>
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mt-1">
            Total
          </span>
        </div>
      </div>

      {/* Bottom: Gender stats */}
      <div className="w-full flex items-center justify-between px-1 mt-3 pt-3 border-t border-border/50">
        <div className="flex flex-col items-center flex-1 gap-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10">
            <User className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">{maleCount}</span>
          <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">Male</span>
        </div>

        <div className="h-8 w-px bg-border/60" />

        <div className="flex flex-col items-center flex-1 gap-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-500/10">
            <User className="size-3.5 text-purple-500" />
          </div>
          <span className="text-sm font-bold text-foreground">{femaleCount}</span>
          <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">Female</span>
        </div>
      </div>
    </div>
  );
};
