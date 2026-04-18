import { Navigate, useLocation } from "react-router-dom";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSchool } from "@/contexts/SchoolContext";
import { useUserRoles } from "@/hooks/useUserRoles";

/**
 * Blocks access to the entire app when the trial has expired and there is no
 * active subscription. Always allows /settings/billing through so the admin
 * can subscribe. Non-admins see a simple message because only admins can pay.
 */
export const SubscriptionGate = ({ children }: { children: React.ReactNode }) => {
  const { hasAccess, status } = useFeatureAccess();
  const { loading: schoolLoading } = useSchool();
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();
  const location = useLocation();

  // Wait for context to settle to avoid a flash redirect.
  if (schoolLoading || rolesLoading) return <>{children}</>;

  // Always allow billing through.
  if (location.pathname.startsWith("/settings/billing")) return <>{children}</>;

  if (hasAccess) return <>{children}</>;

  // Admin → send to billing to subscribe.
  if (isAdmin) {
    return <Navigate to="/settings/billing" replace state={{ from: location.pathname }} />;
  }

  // Non-admin → friendly message.
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-bold">Subscription required</h1>
        <p className="text-muted-foreground">
          Your school's {status === "suspended" ? "account is suspended" : "trial has ended"}.
          Please contact your school administrator to restore access.
        </p>
      </div>
    </div>
  );
};
