import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useUserManagement } from "@/hooks/useUserManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ParentUsersTab = () => {
  const { users, usersLoading, assignRole, removeRole } = useUserManagement();

  const parentUsers = users?.filter(
    (u) => u.user_roles.some((r) => r.role === "parent")
  ) || [];

  const unassignedUsers = users?.filter(
    (u) => u.user_roles.length === 0
  ) || [];

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Parents ({parentUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parentUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No parents assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {parentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Parent</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeRole.mutate({ userId: user.user_id, role: "parent" })}
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
                    onClick={() => assignRole.mutate({ userId: user.user_id, role: "parent" })}
                  >
                    Assign Parent
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ParentPanel = () => {
  return (
    <AppShell activeTab="parents">
      <div className="py-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Parent Management</h1>
          <p className="text-muted-foreground">Manage parent users and role assignments</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <ParentUsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default ParentPanel;
