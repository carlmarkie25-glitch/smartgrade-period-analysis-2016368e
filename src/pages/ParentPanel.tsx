import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Link2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { ParentUsersTab } from "@/components/ParentUsersTab";
import { ParentChildrenOverviewTab } from "@/components/ParentChildrenOverviewTab";

const ParentPanel = () => {
  return (
    <AppShell activeTab="parents">
      <div className="py-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Parent Management</h1>
          <p className="text-muted-foreground">Manage parent accounts, role assignments, and child linkages</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="children">
              <Link2 className="h-4 w-4 mr-2" />
              Children Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <ParentUsersTab />
          </TabsContent>

          <TabsContent value="children">
            <ParentChildrenOverviewTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default ParentPanel;
