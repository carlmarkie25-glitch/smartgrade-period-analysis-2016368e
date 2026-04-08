import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Link2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { ParentUsersTab } from "@/components/ParentUsersTab";
import { ParentChildrenOverviewTab } from "@/components/ParentChildrenOverviewTab";

const ParentPanel = () => {
  return (
    <AppShell activeTab="parents">
      <div className="py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Parent Management</h1>
          <p className="text-sm text-gray-500">Manage parent accounts, role assignments, and child linkages</p>
        </div>

        <div className="neu-card p-4">
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-[hsl(210,80%,96%)] rounded-xl p-1">
              <TabsTrigger value="users" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Users className="h-3.5 w-3.5 mr-1.5" />Users
              </TabsTrigger>
              <TabsTrigger value="children" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Link2 className="h-3.5 w-3.5 mr-1.5" />Children Overview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users"><ParentUsersTab /></TabsContent>
            <TabsContent value="children"><ParentChildrenOverviewTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
};

export default ParentPanel;
