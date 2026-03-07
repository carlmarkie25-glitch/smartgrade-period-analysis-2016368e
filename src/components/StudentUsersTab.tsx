import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, GraduationCap } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";

export const StudentUsersTab = () => {
  const { users, usersLoading, assignRole, removeRole } = useUserManagement();

  // Filter to only show users who have the "student" role or no roles (potential students)
  const studentUsers = users?.filter(u => {
    const roles = u.user_roles?.map((r: any) => r.role) || [];
    return roles.includes("student");
  }) || [];

  const unassignedUsers = users?.filter(u => {
    return !u.user_roles || u.user_roles.length === 0;
  }) || [];

  if (usersLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading users...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Student Users ({studentUsers.length})
          </CardTitle>
          <CardDescription>Users with the student role</CardDescription>
        </CardHeader>
        <CardContent>
          {studentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No student users found</p>
          ) : (
            <div className="space-y-3">
              {studentUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {user.user_roles?.map((ur: any) => (
                        <span key={ur.role} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
                          {ur.role}
                          <button
                            onClick={() => removeRole.mutate({ userId: user.user_id, role: ur.role })}
                            className="hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unassigned Users - can be assigned as students */}
      <Card>
        <CardHeader>
          <CardTitle>Unassigned Users ({unassignedUsers.length})</CardTitle>
          <CardDescription>Users without any role — assign them as students</CardDescription>
        </CardHeader>
        <CardContent>
          {unassignedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">All users have roles assigned</p>
          ) : (
            <div className="space-y-3">
              {unassignedUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => assignRole.mutate({ userId: user.user_id, role: "student" })}
                  >
                    Assign Student Role
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
