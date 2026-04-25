import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

const activities = [
  { id: 1, type: "success", text: "Senior High result processing complete", time: "2 hours ago" },
  { id: 2, type: "pending", text: "Draft report review in progress", time: "4 hours ago" },
  { id: 3, type: "alert", text: "System maintenance scheduled for midnight", time: "6 hours ago" },
  { id: 4, type: "success", text: "New academic period initialized", time: "1 day ago" },
];

export const ActivityList = () => {
  return (
    <div className="glass-card p-10 flex flex-col h-full">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tighter">System Activity</h3>
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mt-1">Institutional Event Log</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
      
      <div className="space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="group flex items-start gap-5 p-5 glass-panel !rounded-[1.8rem] bg-white/5 hover:bg-white/10 transition-all cursor-default border-white/5 hover:border-white/20">
            <div className={`mt-1 h-10 w-10 rounded-[1.2rem] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
              activity.type === "success" ? "bg-emerald-500/10 text-emerald-500" :
              activity.type === "pending" ? "bg-amber-500/10 text-amber-500" :
              "bg-rose-500/10 text-rose-500"
            }`}>
              {activity.type === "success" ? <CheckCircle2 className="h-5 w-5" /> :
               activity.type === "pending" ? <Clock className="h-5 w-5" /> :
               <AlertCircle className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white tracking-tight leading-tight group-hover:text-primary transition-colors">{activity.text}</p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] mt-2">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="mt-auto w-full py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] hover:text-white transition-colors border-t border-white/5 pt-8">
        Retrieve Full Archive
      </button>
    </div>
  );
};
