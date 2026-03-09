import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ActivityListProps {
  title?: string;
}

export const ActivityList = ({ title = "Recently Enrolled Students" }: ActivityListProps) => {
  const { data: recentStudents = [], isLoading } = useQuery({
    queryKey: ["recent-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, student_id, created_at, classes(name)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div
      className="rounded-[20px] p-5 h-full flex flex-col"
      style={{
        background: "hsl(170, 25%, 96%)",
        boxShadow: "8px 8px 16px hsl(170, 25%, 88%), -8px -8px 16px hsl(0, 0%, 100%)",
      }}
    >
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span
          className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 rounded-full"
          style={{
            background: "hsl(170, 25%, 96%)",
            boxShadow: "inset 2px 2px 4px hsl(170, 25%, 88%), inset -2px -2px 4px hsl(0, 0%, 100%)",
          }}
        >
          Latest
        </span>
      </div>

      <div className="space-y-2.5 overflow-y-auto scrollbar-hide flex-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[15px] p-3 animate-pulse"
              style={{
                background: "hsl(170, 25%, 97%)",
                boxShadow: "4px 4px 8px hsl(170, 25%, 90%), -4px -4px 8px hsl(0, 0%, 100%)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-3 bg-[hsl(170,20%,88%)] rounded" />
                <div className="w-8 h-8 rounded-full bg-[hsl(170,20%,88%)]" />
                <div className="flex-1 h-3 bg-[hsl(170,20%,88%)] rounded" />
              </div>
            </div>
          ))
        ) : recentStudents.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No students enrolled yet</p>
        ) : (
          recentStudents.map((student) => (
            <div
              key={student.id}
              className="group rounded-[15px] px-4 py-3 cursor-pointer transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: "hsl(170, 25%, 97%)",
                boxShadow: "4px 4px 10px hsl(170, 25%, 89%), -4px -4px 10px hsl(0, 0%, 100%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "2px 2px 6px hsl(170, 25%, 89%), -2px -2px 6px hsl(0, 0%, 100%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "4px 4px 10px hsl(170, 25%, 89%), -4px -4px 10px hsl(0, 0%, 100%)";
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10">
                  <p className="text-[10px] font-semibold text-gray-400">
                    {format(new Date(student.created_at), "MMM d")}
                  </p>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold"
                  style={{
                    background: "linear-gradient(135deg, hsl(170, 55%, 38%), hsl(170, 45%, 28%))",
                    boxShadow: "2px 2px 6px hsl(170, 25%, 88%)",
                  }}
                >
                  {student.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 truncate">{student.full_name}</p>
                  <p className="text-[9px] text-gray-400 truncate">
                    {(student.classes as any)?.name || "—"}
                  </p>
                </div>
                <button className="flex-shrink-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[hsl(170,50%,40%)]">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
