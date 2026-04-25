import AppShell from "@/components/AppShell";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, CheckCheck, Calendar, UserPlus, Megaphone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const typeIcons: Record<string, any> = {
  calendar: Calendar,
  student_added: UserPlus,
  announcement: Megaphone,
  general: Info,
};

const Notifications = () => {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <AppShell activeTab="notifications">
      <div className="flex flex-col gap-6 pb-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] glass-panel flex items-center justify-center border border-white/20 p-1.5 shadow-none">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">
                <Bell className="size-8" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1.5">Communication Center</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Notifications
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {unreadCount > 0 && (
               <Button
                 variant="ghost"
                 onClick={() => markAllAsRead.mutate()}
                 className="h-11 px-6 rounded-2xl glass-panel border-none text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white"
               >
                 <CheckCheck className="size-4 mr-2" />
                 Mark All as Read
               </Button>
             )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="glass-card p-20 flex flex-col items-center justify-center text-center">
               <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-primary animate-spin" />
               <p className="mt-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Synchronizing Stream…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="glass-card p-24 flex flex-col items-center justify-center text-center">
               <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Bell className="size-8 text-white/10" />
               </div>
               <h3 className="text-xl font-black text-white tracking-tight">System Silent</h3>
               <p className="text-sm text-white/40 mt-2 max-w-xs">You're completely caught up with all academic and administrative updates.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcons[n.type] || Info;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "glass-card p-6 flex items-start gap-6 cursor-pointer transition-all duration-300 group hover:border-white/20",
                    !n.is_read ? "border-l-4 border-l-secondary bg-white/10" : "opacity-60 grayscale-[0.5]"
                  )}
                  onClick={() => {
                    if (!n.is_read) markAsRead.mutate(n.id);
                  }}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-[1.2rem] flex items-center justify-center shrink-0 transition-colors",
                    !n.is_read ? "bg-secondary/20 text-secondary" : "bg-white/5 text-white/30 group-hover:bg-white/10"
                  )}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h3 className={cn(
                        "text-base font-black tracking-tight truncate transition-colors",
                        !n.is_read ? "text-white" : "text-white/40"
                      )}>
                        {n.title}
                      </h3>
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest whitespace-nowrap">
                        {format(new Date(n.created_at), "MMM dd · h:mm a")}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm leading-relaxed mb-4 line-clamp-2",
                      !n.is_read ? "text-white/70" : "text-white/30"
                    )}>{n.message}</p>
                    
                    <div className="flex items-center gap-2">
                       <div className="px-2.5 py-1 glass-pill text-[9px] font-black text-white/40 uppercase tracking-widest bg-white/5">
                          {n.target_role === "all" ? "Everyone" : n.target_role}
                       </div>
                       {!n.is_read && (
                         <div className="px-2.5 py-1 rounded-full bg-secondary text-white text-[9px] font-black uppercase tracking-widest">New Update</div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Notifications;
