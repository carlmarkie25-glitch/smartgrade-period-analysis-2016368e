import AppShell from "@/components/AppShell";
import { ClassManagementTab } from "@/components/ClassManagementTab";

const ClassesPage = () => {
  return (
    <AppShell activeTab="classes">
      <div className="py-4">
        <div className="neu-card p-6 mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">Class Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage classes, assign teachers and departments</p>
        </div>
        <ClassManagementTab />
      </div>
    </AppShell>
  );
};

export default ClassesPage;
