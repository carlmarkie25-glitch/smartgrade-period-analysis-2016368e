import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";

export const TeacherRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isTeacher, isLoading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();

  const isLoading = authLoading || rolesLoading;
  const hasAccess = isAdmin || isTeacher;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!hasAccess) {
        navigate("/dashboard");
      }
    }
  }, [user, hasAccess, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return user && hasAccess ? <>{children}</> : null;
};
