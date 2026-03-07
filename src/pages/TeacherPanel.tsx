import { Users } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useUserManagement } from "@/hooks/useUserManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const TeacherPanel = () => {
  const { users, usersLoading, assignRole, removeRole } = useUserManagement();

  const teacherUsers = users?.filter(
    (u) => u.user_roles.some((r) => r.role === "teacher")
  ) || [];

  const unassignedUsers = users?.filter(
    (u) => u.user_roles.length === 0
  ) || [];

  return (
    <AppShell activeTab="teachers">
      <div className="py-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Teacher Management</h1>
          <p className="text-muted-foreground">Manage teacher users and role assignments</p>
        </div>

        {usersLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teachers ({teacherUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teacherUsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No teachers assigned yet.</p>
                ) : (
                  <div className="space-y-3">
                    {teacherUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Teacher</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRole.mutate({ userId: user.user_id, role: "teacher" })}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {unassignedUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Unassigned Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {unassignedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => assignRole.mutate({ userId: user.user_id, role: "teacher" })}
                        >
                          Assign Teacher
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default TeacherPanel;
