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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users2 className="h-5 w-5" />
          Parent-Child Linkages
        </CardTitle>
        <CardDescription>
          Overview of all parent-child relationships in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {parentGroups.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No parent-child linkages have been created yet. Use the Users tab to link children to parents.
          </p>
        ) : (
          <div className="space-y-6">
            {parentGroups.map((group) => {
              const parentProfile = getParentProfile(group.parentUserId);
              return (
                <div key={group.parentUserId} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{parentProfile?.full_name || "Unknown Parent"}</span>
                    <span className="text-sm text-muted-foreground">({parentProfile?.email})</span>
                    <Badge variant="outline" className="ml-auto">
                      {group.children?.length || 0} child{(group.children?.length || 0) !== 1 ? "ren" : ""}
                    </Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Gender</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.children?.map((child) => (
                        <TableRow key={child.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={child.student?.photo_url || ""} />
                                <AvatarFallback className="text-xs">
                                  {child.student?.full_name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("") || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{child.student?.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{child.student?.student_id}</TableCell>
                          <TableCell>{child.student?.class?.name || "—"}</TableCell>
                          <TableCell>{child.student?.department?.name || "—"}</TableCell>
                          <TableCell>
                            {child.student?.gender ? (
                              <Badge variant="outline" className="capitalize">
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
      </CardContent>
    </Card>
  );
};
