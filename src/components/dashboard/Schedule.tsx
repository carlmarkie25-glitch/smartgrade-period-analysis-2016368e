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
      className="rounded-[26px] p-6 md:p-7"
      style={{
        background: "hsl(170, 25%, 96%)",
        boxShadow: "10px 10px 20px hsl(170, 25%, 87%), -10px -10px 20px hsl(0, 0%, 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-gray-700 tracking-tight">My Schedule</h3>
        <div
          className="px-4 py-1.5 rounded-full flex items-center"
          style={{
            background: "hsl(170, 25%, 96%)",
            boxShadow: "inset 3px 3px 6px hsl(170, 25%, 88%), inset -3px -3px 6px hsl(0, 0%, 100%)",
          }}
        >
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Weekly</span>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex justify-between gap-2 mb-5">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => setActiveDay(index)}
            className="flex flex-col items-center px-2 py-2.5 rounded-[14px] transition-all duration-300 flex-1"
            style={
              activeDay === index
                ? {
                    background: "linear-gradient(135deg, hsl(170, 55%, 45%), hsl(160, 50%, 40%))",
                    boxShadow: "4px 4px 8px hsl(170, 25%, 87%), -2px -2px 6px hsl(0, 0%, 100%)",
                    color: "white",
                  }
                : {
                    background: "hsl(170, 25%, 96%)",
                    boxShadow: "4px 4px 8px hsl(170, 25%, 88%), -4px -4px 8px hsl(0, 0%, 100%)",
                    color: "hsl(170, 10%, 55%)",
                  }
            }
          >
            <span className="text-sm font-black leading-none mb-0.5">{day.short}</span>
            <span className="text-[8px] font-bold uppercase tracking-wider opacity-75">{day.long}</span>
          </button>
        ))}
      </div>

      {/* Timeline Inner Container */}
      <div
        className="rounded-[18px] p-4 max-h-48 overflow-y-auto"
        style={{
          background: "hsl(170, 25%, 96%)",
          boxShadow: "inset 4px 4px 10px hsl(170, 25%, 88%), inset -4px -4px 10px hsl(0, 0%, 100%)",
        }}
      >
        <div className="space-y-1">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className="flex items-center gap-3 py-2 px-2 rounded-xl transition-all duration-200 cursor-pointer group"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "hsl(170, 20%, 93%)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              <div className="flex items-center gap-1.5 flex-shrink-0 w-12">
                <Clock className="h-2.5 w-2.5 text-[hsl(170,30%,55%)]" />
                <p className="text-[10px] font-bold text-gray-400 tabular-nums">{slot.time}</p>
              </div>
              <div
                className="w-0.5 h-5 rounded-full flex-shrink-0"
                style={{
                  background: "linear-gradient(to bottom, hsl(170, 55%, 45%), hsl(160, 50%, 56%))",
                }}
              />
              <p className="text-xs font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">
                {slot.class}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
