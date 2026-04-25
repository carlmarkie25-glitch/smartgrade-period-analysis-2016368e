import { CalendarDays, Clock } from "lucide-react";

const events = [
  { time: "08:00 AM", title: "Morning Assembly", type: "Standard" },
  { time: "10:30 AM", title: "Staff Sync: Finals", type: "Admin" },
  { time: "02:00 PM", title: "Parent Conference", type: "External" },
];

export const Schedule = () => {
  return (
    <div className="glass-card p-10 flex flex-col">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tighter">Daily Horizon</h3>
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mt-1">Operational Timeline</p>
        </div>
        <div className="p-3 bg-secondary/10 rounded-2xl">
          <CalendarDays className="h-5 w-5 text-secondary" />
        </div>
      </div>
      
      <div className="space-y-4">
        {events.map((event, i) => (
          <div key={i} className="flex items-center gap-6 p-4 glass-panel !rounded-[1.5rem] bg-white/5 hover:bg-white/10 transition-all group cursor-default">
            <div className="text-center min-w-[70px]">
              <p className="text-xs font-black text-white">{event.time.split(' ')[0]}</p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">{event.time.split(' ')[1]}</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex-1">
              <p className="text-sm font-black text-white tracking-tight leading-none mb-1 group-hover:text-secondary transition-colors">{event.title}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                  event.type === 'Admin' ? 'bg-primary/20 text-primary' :
                  event.type === 'External' ? 'bg-secondary/20 text-secondary' :
                  'bg-white/10 text-white/50'
                }`}>
                  {event.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
