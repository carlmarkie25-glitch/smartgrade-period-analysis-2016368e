import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface School {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  primary_color: string | null;
  country: string | null;
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  max_students: number;
}

interface SchoolContextType {
  school: School | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setSchool(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    // RLS limits this to the user's own school
    const { data } = await supabase.from("schools").select("*").limit(1).maybeSingle();
    setSchool((data as any) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <SchoolContext.Provider value={{ school, loading, refresh: load }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used within SchoolProvider");
  return ctx;
};
