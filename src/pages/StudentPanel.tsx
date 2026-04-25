import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, Receipt } from "lucide-react";
import { UserBiodataManagementTab } from "@/components/UserBiodataManagementTab";
import { StudentUsersTab } from "@/components/StudentUsersTab";
import StudentPaymentReceipts from "@/components/StudentPaymentReceipts";
import AppShell from "@/components/AppShell";

const StudentPanel = () => {
  return (
    <AppShell activeTab="students">
      <div className="py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Student Management</h1>
          <p className="text-sm text-gray-500">Manage students, biodata, enrollment, and classes</p>
        </div>

        <div className="neu-card p-4">
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-[hsl(210,80%,96%)] rounded-xl p-1">
              <TabsTrigger value="users" className="rounded-lg text-xs  data-[state=active]:shadow-sm">
                <Users className="h-3.5 w-3.5 mr-1.5" />Students
              </TabsTrigger>
              <TabsTrigger value="biodata" className="rounded-lg text-xs  data-[state=active]:shadow-sm">
                <FileText className="h-3.5 w-3.5 mr-1.5" />Biodata
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-lg text-xs  data-[state=active]:shadow-sm">
                <Receipt className="h-3.5 w-3.5 mr-1.5" />Payments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users"><StudentUsersTab /></TabsContent>
            <TabsContent value="biodata"><UserBiodataManagementTab /></TabsContent>
            <TabsContent value="payments"><StudentPaymentReceipts /></TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
};

export default StudentPanel;
