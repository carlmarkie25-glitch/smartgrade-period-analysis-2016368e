import AppShell from "@/components/AppShell";
import { DepartmentManagementTab } from "@/components/DepartmentManagementTab";

const DepartmentsPage = () => {
  return (
    <AppShell activeTab="departments">
      <div className="py-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Department Management</h1>
          <p className="text-muted-foreground">Create and manage school departments</p>
        </div>
        <DepartmentManagementTab />
      </div>
    </AppShell>
  );
};

export default DepartmentsPage;
