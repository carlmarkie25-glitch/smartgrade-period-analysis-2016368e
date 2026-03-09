import AppShell from "@/components/AppShell";
import { SubjectManagementTab } from "@/components/SubjectManagementTab";

const SubjectsPage = () => {
  return (
    <AppShell activeTab="subjects">
      <div className="py-4">
        <div className="neu-card p-6 mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">Subject Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage subjects across the school</p>
        </div>
        <SubjectManagementTab />
      </div>
    </AppShell>
  );
};

export default SubjectsPage;
