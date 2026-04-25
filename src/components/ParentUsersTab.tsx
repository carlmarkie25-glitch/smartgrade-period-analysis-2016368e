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
      <div className="glass-panel p-8 border border-white/10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              Authorized Parent Cluster ({parentUsers.length})
            </h3>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">Manage parental access and student associations</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest">
            <UserPlus className="h-4 w-4 mr-2" />
            Provision New Parent
          </Button>
        </div>
        <div>

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
                    <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="py-6">
                        <div>
                          <p className="text-sm font-black text-white">{user.full_name}</p>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{user.email}</p>
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
                                className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest py-1 px-3"
                              >
                                {child.student?.full_name}
                                {child.student?.class?.name && (
                                  <span className="text-white/40 ml-1">
                                    [{child.student.class.name}]
                                  </span>
                                )}
                                <button
                                  onClick={() => handleUnlinkChild(child.id)}
                                  className="ml-2 hover:bg-rose-500/20 rounded-full p-0.5 text-rose-400 transition-colors"
                                  title="Unlink child"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-6">
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="outline"
                            className="bg-white/5 border-white/10 hover:bg-white/10 text-white h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest"
                            onClick={() =>
                              setAssignmentParent({
                                id: user.id,
                                user_id: user.user_id,
                                full_name: user.full_name,
                              })
                            }
                          >
                            <Link2 className="h-3.5 w-3.5 mr-2 text-primary" />
                            Link Student
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 text-rose-400 h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest"
                            disabled={removingId === user.user_id}
                            onClick={() => handleRemoveParent(user.user_id, user.full_name)}
                          >
                            <Unlink className="h-3.5 w-3.5 mr-2" />
                            {removingId === user.user_id ? "Terminating..." : "Revoke Access"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Unassigned Users */}
      {unassignedUsers.length > 0 && (
        <div className="glass-panel p-8 border border-white/10 mt-8">
          <div className="mb-8">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-emerald-400" />
              Unassigned Clusters ({unassignedUsers.length})
            </h3>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">Provision access for newly registered users</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-white/40 font-black text-[10px] uppercase tracking-widest">User Identity</TableHead>
                <TableHead className="text-right text-white/40 font-black text-[10px] uppercase tracking-widest">Action Vector</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unassignedUsers.map((user) => (
                <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="py-6">
                    <div>
                      <p className="text-sm font-black text-white">{user.full_name}</p>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-6">
                    <Button
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest"
                      onClick={() =>
                        assignRole.mutate({ userId: user.user_id, role: "parent" })
                      }
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Grant Parent Access
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
