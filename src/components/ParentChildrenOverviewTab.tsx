import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const ParentChildrenOverviewTab = () => {
  // Fetch all assignments with parent and student details
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["parent-children-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_student_assignments")
        .select(`
          id,
          parent_user_id,
          student_id,
          student:students(
            id, student_id, full_name, photo_url, gender,
            class:classes(name),
            department:departments(name)
          )
        `);

      if (error) throw error;
      return data;
    },
  });

  // Fetch parent profiles
  const { data: profiles } = useQuery({
    queryKey: ["parent-profiles-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email");

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Group assignments by parent
  const groupedByParent = (assignments || []).reduce<
    Record<string, { parentUserId: string; children: typeof assignments }>
  >((acc, assignment) => {
    const key = assignment.parent_user_id;
    if (!acc[key]) {
      acc[key] = { parentUserId: key, children: [] };
    }
    acc[key].children!.push(assignment);
    return acc;
  }, {});

  const parentGroups = Object.values(groupedByParent);

  const getParentProfile = (userId: string) => {
    return profiles?.find((p) => p.user_id === userId);
  };

  return (
    <div className="glass-panel p-8 border border-white/10">
      <div className="mb-8">
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
          <Users2 className="h-6 w-6 text-primary" />
          Parent-Child Linkage Registry
        </h3>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">Comprehensive overview of all verified family associations</p>
      </div>

      <div>
        {parentGroups.length === 0 ? (
          <p className="text-white/30 text-sm font-black uppercase tracking-[0.2em] text-center py-20">
            No active linkages detected in the neural registry.
          </p>
        ) : (
          <div className="space-y-10">
            {parentGroups.map((group) => {
              const parentProfile = getParentProfile(group.parentUserId);
              return (
                <div key={group.parentUserId} className="glass-card border-white/5 overflow-hidden">
                  <div className="bg-white/5 px-6 py-4 flex items-center gap-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{parentProfile?.full_name || "Unknown Parent"}</p>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{parentProfile?.email}</p>
                    </div>
                    <Badge className="ml-auto bg-primary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1">
                      {group.children?.length || 0} ASSOCIATION{(group.children?.length || 0) !== 1 ? "S" : ""}
                    </Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5">
                        <TableHead className="text-white/40 font-black text-[9px] uppercase tracking-widest px-6">Student Cluster</TableHead>
                        <TableHead className="text-white/40 font-black text-[9px] uppercase tracking-widest">Node ID</TableHead>
                        <TableHead className="text-white/40 font-black text-[9px] uppercase tracking-widest">Cohort</TableHead>
                        <TableHead className="text-white/40 font-black text-[9px] uppercase tracking-widest">Division</TableHead>
                        <TableHead className="text-white/40 font-black text-[9px] uppercase tracking-widest">Gender</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.children?.map((child) => (
                        <TableRow key={child.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-white/10 rounded-xl">
                                <AvatarImage src={child.student?.photo_url || ""} />
                                <AvatarFallback className="text-[10px] font-black bg-white/5 text-white/50">
                                  {child.student?.full_name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("") || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-black text-white">{child.student?.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px] font-bold text-white/60 font-mono tracking-wider">{child.student?.student_id}</TableCell>
                          <TableCell className="text-[10px] font-black text-white/40 uppercase tracking-widest">{child.student?.class?.name || "—"}</TableCell>
                          <TableCell className="text-[10px] font-black text-white/40 uppercase tracking-widest">{child.student?.department?.name || "—"}</TableCell>
                          <TableCell>
                            {child.student?.gender ? (
                              <Badge className="bg-white/5 text-white/60 border-white/10 text-[8px] font-black uppercase tracking-widest">
                                {child.student.gender}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
