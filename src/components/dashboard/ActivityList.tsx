import { MoreVertical, ChevronRight } from "lucide-react";

interface Activity {
  id: string;
  time: string;
  studentName: string;
  className: string;
  type?: "meeting" | "submission" | "event";
}

interface ActivityListProps {
  activities?: Activity[];
  title?: string;
}

export const ActivityList = ({
  activities = [
    { id: "1", time: "09:00", studentName: "Sarah Holden", className: "Grade 10A" },
    { id: "2", time: "09:30", studentName: "Angelo John", className: "Grade 11B" },
    { id: "3", time: "10:00", studentName: "Seraphina Mathew", className: "Grade 9A" },
    { id: "4", time: "10:30", studentName: "John Jacobs Mathew", className: "Grade 12B" },
    { id: "5", time: "12:00", studentName: "Sara Watson", className: "Grade 10A" },
    { id: "6", time: "14:00", studentName: "Seraphina Master", className: "Grade 11A" },
    { id: "7", time: "15:00", studentName: "Orizakel Stone", className: "Grade 9B" },
    { id: "8", time: "16:00", studentName: "Zane Andrews", className: "Grade 10C" },
  ],
  title = "Today's Activities",
}: ActivityListProps) => {
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-teal-200/30 p-6 shadow-lg">
      {/* Header with Options */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-teal-600/70 px-2.5 py-1 bg-teal-50/50 rounded-lg">
            Weekly
          </span>
          <button className="p-1.5 rounded-lg hover:bg-teal-50/50 transition-colors text-gray-500 hover:text-teal-600">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="group flex items-center justify-between p-3 rounded-xl hover:bg-teal-50/60 transition-all duration-200 cursor-pointer"
          >
            {/* Left Content */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Time */}
              <div className="flex-shrink-0 w-12">
                <p className="text-xs font-bold text-teal-600/80">{activity.time}</p>
              </div>

              {/* Avatar Circle */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-300 to-emerald-300 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-md">
                {activity.studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {activity.studentName}
                </p>
                <p className="text-xs text-teal-600/70 font-medium">{activity.className}</p>
              </div>
            </div>

            {/* Right Action */}
            <button className="flex-shrink-0 ml-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400 hover:text-teal-600">
              <ChevronRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
