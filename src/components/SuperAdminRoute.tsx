import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";

export const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, isLoading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const isLoading = authLoading || rolesLoading;

  useEffect(() => {
    if (isLoading) return;
    if (!user) navigate("/auth");
    else if (!isSuperAdmin) navigate("/dashboard");
  }, [user, isSuperAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  return user && isSuperAdmin ? <>{children}</> : null;
};
