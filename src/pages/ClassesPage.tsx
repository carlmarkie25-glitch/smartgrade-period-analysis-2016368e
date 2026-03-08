import AppShell from "@/components/AppShell";
import { ClassManagementTab } from "@/components/ClassManagementTab";

const ClassesPage = () => {
  return (
    <AppShell activeTab="classes">
      <div className="py-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Class Management</h1>
          <p className="text-muted-foreground">Create and manage classes, assign teachers and departments</p>
        </div>
        <ClassManagementTab />
      </div>
    </AppShell>
  );
};

export default ClassesPage;
