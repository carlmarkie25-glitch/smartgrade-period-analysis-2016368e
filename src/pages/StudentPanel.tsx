import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, GraduationCap } from "lucide-react";
import { StudentManagementTab } from "@/components/StudentManagementTab";
import { UserBiodataManagementTab } from "@/components/UserBiodataManagementTab";
import { StudentUsersTab } from "@/components/StudentUsersTab";
import AppShell from "@/components/AppShell";

const StudentPanel = () => {
  return (
    <AppShell activeTab="students">
      <div className="py-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Student Management</h1>
          <p className="text-muted-foreground">Manage student users, biodata, enrollment, and classes</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="biodata">
              <FileText className="h-4 w-4 mr-2" />
              Biodata
            </TabsTrigger>
            <TabsTrigger value="students">
              <GraduationCap className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <StudentUsersTab />
          </TabsContent>

          <TabsContent value="biodata">
            <UserBiodataManagementTab />
          </TabsContent>

          <TabsContent value="students">
            <StudentManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default StudentPanel;
