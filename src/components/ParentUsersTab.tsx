import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Link2, Unlink, X } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ParentChildAssignmentDialog } from "./ParentChildAssignmentDialog";
import { CreateParentDialog } from "./CreateParentDialog";

export const ParentUsersTab = () => {
  const { users, usersLoading, assignRole } = useUserManagement();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignmentParent, setAssignmentParent] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveParent = async (parentUserId: string, name: string) => {
    if (!confirm(`Remove parent "${name}"? This will permanently delete their account and unlink all children.`)) return;
    setRemovingId(parentUserId);
    try {
      const { data, error } = await supabase.functions.invoke("delete-parent-account", {
        body: { parent_user_id: parentUserId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Parent removed" });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["all-parent-assignments-with-students"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const parentUsers = users?.filter(
    (u) => u.user_roles.some((r: any) => r.role === "parent")
  ) || [];

  const unassignedUsers = users?.filter(
    (u) => !u.user_roles || u.user_roles.length === 0
  ) || [];

  // Fetch all parent-student assignments with student details
  const { data: allAssignments } = useQuery({
    queryKey: ["all-parent-assignments-with-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_student_assignments")
        .select(`
          id,
          parent_user_id,
          student_id,
          student:students(id, full_name, student_id, class:classes(name))
        `);

      if (error) throw error;
      return data;
    },
  });

  const getLinkedChildren = (userIdAuth: string) => {
    return allAssignments?.filter((a) => a.parent_user_id === userIdAuth) || [];
  };

  const handleUnlinkChild = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("parent_student_assignments")
        .delete()
        .eq("id", assignmentId);
      if (error) throw error;
      toast({ title: "Child unlinked successfully" });
      queryClient.invalidateQueries({ queryKey: ["all-parent-assignments-with-students"] });
      queryClient.invalidateQueries({ queryKey: ["all-parent-assignments"] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (usersLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Parent Users with linked children */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Parents ({parentUsers.length})
            </CardTitle>
            <CardDescription>Manage parent accounts and their linked children</CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Add Parent
          </Button>
        </CardHeader>
        <CardContent>
          {parentUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No parents assigned yet. Assign the parent role to users from the Unassigned Users section below.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Linked Children</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parentUsers.map((user) => {
                  const children = getLinkedChildren(user.user_id);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {children.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No children linked</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {children.map((child) => (
                              <Badge
                                key={child.id}
                                variant="secondary"
                                className="flex items-center gap-1 pr-1"
                              >
                                {child.student?.full_name}
                                {child.student?.class?.name && (
                                  <span className="text-muted-foreground">
                                    ({child.student.class.name})
                                  </span>
                                )}
                                <button
                                  onClick={() => handleUnlinkChild(child.id)}
                                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                  title="Unlink child"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAssignmentParent({
                                id: user.id,
                                user_id: user.user_id,
                                full_name: user.full_name,
                              })
                            }
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            Link Children
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={removingId === user.user_id}
                            onClick={() => handleRemoveParent(user.user_id, user.full_name)}
                          >
                            <Unlink className="h-4 w-4 mr-1" />
                            {removingId === user.user_id ? "Removing..." : "Remove Parent"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Unassigned Users */}
      {unassignedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Unassigned Users ({unassignedUsers.length})
            </CardTitle>
            <CardDescription>Assign the parent role to these users</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() =>
                          assignRole.mutate({ userId: user.user_id, role: "parent" })
                        }
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Assign Parent
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Child Assignment Dialog */}
      <ParentChildAssignmentDialog
        open={!!assignmentParent}
        onOpenChange={(open) => !open && setAssignmentParent(null)}
        parent={assignmentParent}
      />

      <CreateParentDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};
