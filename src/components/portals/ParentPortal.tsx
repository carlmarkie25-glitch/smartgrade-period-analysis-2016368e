import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users } from "lucide-react";
import StudentPortalView from "./StudentPortalView";
import { useMyChildren } from "@/hooks/usePortalData";
import { Separator } from "@/components/ui/separator";

const ParentPortal = () => {
  const { data: children, isLoading } = useMyChildren();

  return (
    <AppShell activeTab="dashboard">
      <div className="py-4">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Parent Portal</h1>
            <p className="text-sm text-muted-foreground">
              View grades, attendance, and fees for each of your children.
            </p>
          </div>
          {children && children.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {children.length} {children.length === 1 ? "child" : "children"}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array(2).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        ) : !children || children.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
              <h3 className="font-semibold mb-1">No children linked yet</h3>
              <p className="text-sm text-muted-foreground">
                Your account isn't linked to any students. Please contact your school administrator
                to have your children assigned.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {children.map((child: any, idx: number) => (
              <div key={child.id}>
                {idx > 0 && <Separator className="mb-10" />}
                <StudentPortalView student={child} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ParentPortal;
