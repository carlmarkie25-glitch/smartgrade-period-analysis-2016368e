import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import StudentPortalView from "./StudentPortalView";
import { useMyStudent } from "@/hooks/usePortalData";

const StudentPortal = () => {
  const { data: student, isLoading } = useMyStudent();

  return (
    <AppShell activeTab="dashboard">
      <div className="py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Portal</h1>
          <p className="text-sm text-muted-foreground">
            Track your grades, attendance, and fees in one place.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !student ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
              <h3 className="font-semibold mb-1">No student record linked</h3>
              <p className="text-sm text-muted-foreground">
                Your account isn't linked to a student profile yet. Please contact your school administrator.
              </p>
            </CardContent>
          </Card>
        ) : (
          <StudentPortalView student={student as any} />
        )}
      </div>
    </AppShell>
  );
};

export default StudentPortal;
