import AppShell from "@/components/AppShell";
import { SubjectManagementTab } from "@/components/SubjectManagementTab";

const SubjectsPage = () => {
  return (
    <AppShell activeTab="subjects">
      <div className="py-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Subject Management</h1>
          <p className="text-muted-foreground">Create and manage subjects across the school</p>
        </div>
        <SubjectManagementTab />
      </div>
    </AppShell>
  );
};

export default SubjectsPage;
