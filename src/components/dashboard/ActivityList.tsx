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
      className="rounded-[22px] p-5 h-full flex flex-col bg-card border border-border/60"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-[10px] font-semibold text-muted-foreground px-3 py-1 bg-muted rounded-full border border-border/50 uppercase tracking-wider">
          Latest
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto scrollbar-hide flex-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-3 animate-pulse bg-muted/60 border border-border/40"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-3 bg-muted-foreground/20 rounded" />
                <div className="w-8 h-8 rounded-full bg-muted-foreground/20" />
                <div className="flex-1 h-3 bg-muted-foreground/20 rounded" />
              </div>
            </div>
          ))
        ) : recentStudents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No students enrolled yet</p>
        ) : (
          recentStudents.map((student) => (
            <div
              key={student.id}
              className="group flex items-center gap-3 rounded-2xl px-3.5 py-3 cursor-pointer transition-all duration-150 bg-muted/40 hover:bg-muted border border-border/40 hover:border-border/70"
            >
              <div className="flex-shrink-0 w-10 text-center">
                <p className="text-[9px] font-semibold text-muted-foreground leading-tight">
                  {format(new Date(student.created_at), "MMM")}
                </p>
                <p className="text-xs font-bold text-foreground/70">
                  {format(new Date(student.created_at), "d")}
                </p>
              </div>

              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                style={{
                  background: "linear-gradient(135deg, hsl(220,70%,35%), hsl(220,70%,22%))",
                  color: "hsl(0,0%,100%)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {student.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{student.full_name}</p>
                <p className="text-[9px] text-muted-foreground truncate">
                  {(student.classes as any)?.name || "—"}
                </p>
              </div>

              <ChevronRight
                size={13}
                className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
