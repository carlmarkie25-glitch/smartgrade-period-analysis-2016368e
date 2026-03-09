import { useState } from "react";
import { Clock } from "lucide-react";

interface TimeSlot {
  time: string;
  class: string;
}

interface ScheduleProps {
  timeSlots?: TimeSlot[];
}

export const Schedule = ({
  timeSlots = [
    { time: "10:00", class: "Grade 10 Math" },
    { time: "11:00", class: "Grade 9 Science" },
    { time: "12:00", class: "Grade 11 English" },
    { time: "12:30", class: "Grade 8 History" },
    { time: "13:00", class: "Grade 12 Physics" },
  ],
}: ScheduleProps) => {
  const days = [
    { short: "12", long: "SUN" },
    { short: "13", long: "MON" },
    { short: "14", long: "TUE" },
    { short: "15", long: "WED" },
    { short: "16", long: "THU" },
    { short: "17", long: "FRI" },
    { short: "18", long: "SAT" },
  ];

  const [activeDay, setActiveDay] = useState(3);

  return (
    <div
      className="rounded-[22px] p-6 bg-card border border-border/60"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground">My Schedule</h3>
        <div className="px-3.5 py-1.5 rounded-full bg-muted border border-border/50">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Weekly</span>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex justify-between gap-1.5 mb-5">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => setActiveDay(index)}
            className={`flex flex-col items-center px-2 py-2.5 rounded-[14px] transition-all duration-200 flex-1 ${
              activeDay === index
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
            }`}
          >
            <span className="text-sm font-bold leading-none mb-0.5">{day.short}</span>
            <span className="text-[8px] font-semibold uppercase tracking-wider opacity-80">{day.long}</span>
          </button>
        ))}
      </div>

      {/* Timeline Container */}
      <div className="rounded-[16px] p-3 max-h-48 overflow-y-auto scrollbar-hide bg-muted/40 border border-border/40">
        <div className="space-y-1">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-150 cursor-pointer hover:bg-card group border border-transparent hover:border-border/50"
              style={{ boxShadow: "none" }}
            >
              <div className="flex items-center gap-1.5 flex-shrink-0 w-12">
                <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                <p className="text-[10px] font-semibold text-muted-foreground tabular-nums">{slot.time}</p>
              </div>
              <div className="w-0.5 h-5 rounded-full flex-shrink-0 bg-primary/40" />
              <p className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                {slot.class}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
