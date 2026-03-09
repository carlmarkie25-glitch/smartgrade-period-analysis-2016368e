import AppShell from "@/components/AppShell";
import { DepartmentManagementTab } from "@/components/DepartmentManagementTab";

const DepartmentsPage = () => {
  return (
    <AppShell activeTab="departments">
      <div className="py-4">
        <div className="neu-card p-6 mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">Department Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage school departments</p>
        </div>
        <DepartmentManagementTab />
      </div>
    </AppShell>
  );
};

export default DepartmentsPage;
