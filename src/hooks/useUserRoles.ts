import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export const useUserRoles = () => {
  const { user } = useAuth();

  const { data: roles, isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user roles:", error);
        return [];
      }

      return data?.map((r) => r.role) || [];
    },
    enabled: !!user?.id,
  });

  const hasRole = (role: AppRole): boolean => {
    return roles?.includes(role) || false;
  };

  const isAdmin = hasRole("admin");
  const isTeacher = hasRole("teacher");
  const isStudent = hasRole("student");
  const isParent = hasRole("parent");

  return {
    roles: roles || [],
    isLoading,
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
  };
};
