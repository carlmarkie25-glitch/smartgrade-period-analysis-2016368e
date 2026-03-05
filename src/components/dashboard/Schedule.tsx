import { useState } from "react";

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
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">My Schedule</h3>
        <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">Weekly</span>
      </div>

      {/* Day Selector */}
      <div className="flex justify-between gap-1.5 mb-5">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => setActiveDay(index)}
            className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-300 flex-shrink-0 ${
              activeDay === index
                ? "bg-gradient-to-br from-[hsl(170,50%,50%)] to-[hsl(160,50%,45%)] text-white shadow-md"
                : "text-gray-500 hover:bg-[hsl(170,30%,96%)]"
            }`}
          >
            <span className="text-sm font-bold">{day.short}</span>
            <span className="text-[9px] font-semibold opacity-80">{day.long}</span>
          </button>
        ))}
      </div>

      {/* Time Slots */}
      <div className="space-y-1.5">
        {timeSlots.map((slot, index) => (
          <div
            key={index}
            className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-[hsl(170,30%,96%)] transition-colors cursor-pointer group"
          >
            <div className="w-10 text-center flex-shrink-0">
              <p className="text-xs font-semibold text-gray-400">{slot.time}</p>
            </div>
            <div className="w-0.5 h-6 bg-gradient-to-b from-[hsl(170,50%,50%)] to-[hsl(160,50%,45%)] rounded-full" />
            <p className="text-xs font-medium text-gray-600 group-hover:text-[hsl(170,50%,35%)] transition-colors">
              {slot.class}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
