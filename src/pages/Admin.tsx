import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserPlus, FileText, Palette, Bell, ScrollText } from "lucide-react";
import { UserBiodataManagementTab } from "@/components/UserBiodataManagementTab";
import { TeacherAssignmentDialog } from "@/components/TeacherAssignmentDialog";
import { SponsorAssignmentDialog } from "@/components/SponsorAssignmentDialog";
import { UserRoleManagement } from "@/components/UserRoleManagement";
import AppShell from "@/components/AppShell";
import { SettingsTab } from "@/components/SettingsTab";
import { SendNotificationDialog } from "@/components/SendNotificationDialog";
import { ReportCardSettingsTab } from "@/components/ReportCardSettingsTab";

const Admin = () => {
  const { users, usersLoading, assignRole, removeRole } = useUserManagement();

  const [teacherAssignmentOpen, setTeacherAssignmentOpen] = useState(false);
  const [sponsorAssignmentOpen, setSponsorAssignmentOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{
    id: string;
    user_id: string;
    full_name: string;
  } | null>(null);
  const [selectedSponsor, setSelectedSponsor] = useState<{
    id: string;
    user_id: string;
    full_name: string;
  } | null>(null);

  const handleOpenTeacherAssignment = (user: any) => {
    setSelectedTeacher({
      id: user.id,
      user_id: user.user_id,
      full_name: user.full_name,
    });
    setTeacherAssignmentOpen(true);
  };

  const handleOpenSponsorAssignment = (user: any) => {
    setSelectedSponsor({
      id: user.id,
      user_id: user.user_id,
      full_name: user.full_name,
    });
    setSponsorAssignmentOpen(true);
  };

  return (
    <AppShell activeTab="settings">
      <div className="py-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage users, biodata, and system settings</p>
        </div>

        <div className="neu-card p-6">
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="users">
              <UserPlus className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="biodata">
              <FileText className="h-4 w-4 mr-2" />
              Biodata
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="report-card">
              <ScrollText className="h-4 w-4 mr-2" />
              Report Card
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="h-4 w-4 mr-2" />
              Theme
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserRoleManagement
              users={users}
              usersLoading={usersLoading}
              assignRole={assignRole}
              removeRole={removeRole}
              onOpenTeacherAssignment={handleOpenTeacherAssignment}
              onOpenSponsorAssignment={handleOpenSponsorAssignment}
            />
          </TabsContent>

          <TabsContent value="biodata">
            <UserBiodataManagementTab />
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Send Notifications</h3>
                  <p className="text-sm text-muted-foreground">Send announcements to teachers, students, parents, or everyone</p>
                </div>
                <SendNotificationDialog />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="report-card">
            <ReportCardSettingsTab />
          </TabsContent>

          <TabsContent value="theme">
            <SettingsTab />
          </TabsContent>
        </Tabs>
        </div>
      </div>

      <TeacherAssignmentDialog
        open={teacherAssignmentOpen}
        onOpenChange={setTeacherAssignmentOpen}
        teacher={selectedTeacher}
      />

      <SponsorAssignmentDialog
        open={sponsorAssignmentOpen}
        onOpenChange={setSponsorAssignmentOpen}
        user={selectedSponsor}
      />
    </AppShell>
  );
};

export default Admin;
