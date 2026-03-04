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
    { short: "12", long: "MON" },
    { short: "13", long: "TUE" },
    { short: "14", long: "WED" },
    { short: "15", long: "THU", active: true },
    { short: "16", long: "FRI" },
    { short: "17", long: "SAT" },
    { short: "18", long: "SUN" },
  ];

  const [activeDay, setActiveDay] = useState(3);

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-teal-200/30 p-6 shadow-lg">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-6">My Schedule</h3>

      {/* Day Selector */}
      <div className="flex justify-between gap-2 mb-8 overflow-x-auto pb-2">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => setActiveDay(index)}
            className={`flex flex-col items-center px-3 py-2 rounded-2xl transition-all duration-300 flex-shrink-0 ${
              activeDay === index
                ? "bg-gradient-to-br from-teal-400 to-emerald-400 text-white shadow-lg"
                : "text-gray-600 hover:bg-teal-50/50"
            }`}
          >
            <span className="text-sm font-bold">{day.short}</span>
            <span className="text-xs font-semibold opacity-80">{day.long}</span>
          </button>
        ))}
      </div>

      {/* Time Slots */}
      <div className="space-y-3">
        {timeSlots.map((slot, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-teal-50/50 transition-colors cursor-pointer group"
          >
            <div className="w-12 text-center flex-shrink-0">
              <p className="text-sm font-semibold text-teal-600/80">{slot.time}</p>
            </div>
            <div className="w-1 h-8 bg-gradient-to-b from-teal-400 to-emerald-400 rounded-full" />
            <p className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition-colors">
              {slot.class}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
