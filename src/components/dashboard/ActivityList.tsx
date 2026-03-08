import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ActivityListProps {
  title?: string;
}

export const ActivityList = ({
  title = "Recently Enrolled Students",
}: ActivityListProps) => {
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
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">Latest</span>
      </div>

      <div className="space-y-0.5 overflow-y-auto scrollbar-hide flex-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 py-1.5 px-1 animate-pulse">
              <div className="w-10 h-3 bg-gray-200 rounded" />
              <div className="w-7 h-7 rounded-full bg-gray-200" />
              <div className="flex-1 h-3 bg-gray-200 rounded" />
            </div>
          ))
        ) : recentStudents.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No students enrolled yet</p>
        ) : (
          recentStudents.map((student) => (
            <div
              key={student.id}
              className="group flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-[hsl(170,30%,96%)] transition-all duration-200 cursor-pointer"
            >
              <div className="flex-shrink-0 w-10">
                <p className="text-[10px] font-semibold text-gray-400">
                  {format(new Date(student.created_at), "MMM d")}
                </p>
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(170,40%,65%)] to-[hsl(160,45%,55%)] flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold shadow-sm">
                {student.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{student.full_name}</p>
                <p className="text-[9px] text-gray-400 truncate">
                  {(student.classes as any)?.name || "—"}
                </p>
              </div>
              <button className="flex-shrink-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[hsl(170,50%,40%)]">
                <ChevronRight size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
