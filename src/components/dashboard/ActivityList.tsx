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
    <div
      className="rounded-[20px] p-5 h-full flex flex-col"
      style={{
        background: 'hsl(220, 20%, 96%)',
        boxShadow: '8px 8px 16px hsl(220, 20%, 88%), -8px -8px 16px hsl(0, 0%, 100%)',
      }}
    >
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-[10px] font-medium text-muted-foreground px-2.5 py-1 bg-muted rounded-full">Latest</span>
      </div>

      <div className="space-y-2.5 overflow-y-auto scrollbar-hide flex-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[15px] p-3 animate-pulse"
              style={{
                background: 'hsl(220, 20%, 98%)',
                boxShadow: '4px 4px 8px hsl(220, 20%, 90%), -4px -4px 8px hsl(0, 0%, 100%)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-3 bg-muted rounded" />
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 h-3 bg-muted rounded" />
              </div>
            </div>
          ))
        ) : recentStudents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No students enrolled yet</p>
        ) : (
          recentStudents.map((student) => (
            <div
              key={student.id}
              className="group rounded-[15px] px-4 py-3 cursor-pointer transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: 'hsl(220, 20%, 98%)',
                boxShadow: '4px 4px 10px hsl(220, 20%, 90%), -4px -4px 10px hsl(0, 0%, 100%)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '2px 2px 6px hsl(220, 20%, 90%), -2px -2px 6px hsl(0, 0%, 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 10px hsl(220, 20%, 90%), -4px -4px 10px hsl(0, 0%, 100%)';
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10">
                  <p className="text-[10px] font-semibold text-muted-foreground">
                    {format(new Date(student.created_at), "MMM d")}
                  </p>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-primary-foreground text-[9px] font-bold"
                  style={{
                    background: 'linear-gradient(135deg, hsl(220, 70%, 35%), hsl(220, 70%, 22%))',
                    boxShadow: '2px 2px 6px hsl(220, 20%, 88%)',
                  }}
                >
                  {student.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{student.full_name}</p>
                  <p className="text-[9px] text-muted-foreground truncate">
                    {(student.classes as any)?.name || "—"}
                  </p>
                </div>
                <button className="flex-shrink-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
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
