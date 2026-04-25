import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { User, Shield, Calendar } from "lucide-react";

export const ProfileSummary = () => {
  const { user } = useAuth();
  
  const profileName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = profileName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="glass-card p-10 flex flex-col items-center text-center h-full justify-center group">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
        <Avatar className="h-28 w-28 border-4 border-white/10 relative z-10 shadow-2xl transition-transform duration-500 group-hover:rotate-3">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-3xl font-black tracking-tighter">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-2 -right-2 bg-secondary text-white p-2.5 rounded-2xl shadow-xl z-20 border border-white/20 scale-90 group-hover:scale-110 transition-transform">
          <Shield className="h-5 w-5" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-3xl font-black text-white tracking-tighter leading-tight">{profileName}</h3>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Institutional Administrator</p>
      </div>

      <div className="w-full h-px bg-white/10 my-8" />

      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="bg-white/5 p-4 rounded-[1.5rem] border border-white/5 group-hover:bg-white/10 transition-colors">
          <Calendar className="h-4 w-4 text-secondary mx-auto mb-2" />
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Joined</p>
          <p className="text-xs font-black text-white">Oct 2023</p>
        </div>
        <div className="bg-white/5 p-4 rounded-[1.5rem] border border-white/5 group-hover:bg-white/10 transition-colors">
          <User className="h-4 w-4 text-primary mx-auto mb-2" />
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Status</p>
          <p className="text-xs font-black text-emerald-400">Verified</p>
        </div>
      </div>
    </div>
  );
};
