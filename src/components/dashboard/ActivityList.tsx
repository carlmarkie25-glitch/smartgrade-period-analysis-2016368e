import { ChevronRight } from "lucide-react";

interface Activity {
  id: string;
  time: string;
  studentName: string;
  className: string;
}

interface ActivityListProps {
  activities?: Activity[];
  title?: string;
}

export const ActivityList = ({
  activities = [
    { id: "1", time: "08:00", studentName: "Sarah Hosten", className: "Grade 10A" },
    { id: "2", time: "09:00", studentName: "Angelo John", className: "Grade 11B" },
    { id: "3", time: "10:00", studentName: "Meghon Mathew", className: "Grade 9A" },
    { id: "4", time: "11:00", studentName: "John Jacobs Mathew", className: "Grade 12B" },
    { id: "5", time: "12:00", studentName: "Sara Watson", className: "Grade 10A" },
    { id: "6", time: "13:00", studentName: "Tressa Tiffony", className: "Grade 11A" },
    { id: "7", time: "14:00", studentName: "Meghon Morse", className: "Grade 9B" },
    { id: "8", time: "17:00", studentName: "Wallace Stone", className: "Grade 10C" },
    { id: "9", time: "18:00", studentName: "Jane Andrews", className: "Grade 8A" },
  ],
  title = "Your Patients Today",
}: ActivityListProps) => {
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">Weekly</span>
      </div>

      <div className="space-y-0.5 max-h-[280px] overflow-y-auto scrollbar-hide">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="group flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-[hsl(170,30%,96%)] transition-all duration-200 cursor-pointer"
          >
            <div className="flex-shrink-0 w-10">
              <p className="text-[10px] font-semibold text-gray-400">{activity.time}</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(170,40%,65%)] to-[hsl(160,45%,55%)] flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold shadow-sm">
              {activity.studentName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{activity.studentName}</p>
            </div>
            <button className="flex-shrink-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[hsl(170,50%,40%)]">
              <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
