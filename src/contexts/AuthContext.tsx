import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileAvatar: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshProfile = async (targetUserId?: string | null) => {
    const activeUserId = targetUserId ?? user?.id;
    if (!activeUserId) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, email, avatar_url")
      .eq("user_id", activeUserId)
      .maybeSingle();

    if (error) throw error;
    setProfile(data ?? null);
  };

  const updateProfileAvatar = async (file: File) => {
    if (!user) throw new Error("You must be signed in.");

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `profiles/${user.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("school-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("school-assets").getPublicUrl(path);
    const avatarUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    await refreshProfile(user.id);
    return avatarUrl;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

         if (session?.user) {
           setTimeout(() => {
             refreshProfile(session.user.id).catch(() => setProfile(null));
           }, 0);
         } else {
           setProfile(null);
         }

        // Seed IndexedDB on first login per user (full snapshot)
        if (event === "SIGNED_IN" && session?.user) {
          const seedKey = `lumini:seeded:${session.user.id}`;
          if (typeof window !== "undefined" && !localStorage.getItem(seedKey)) {
            // Defer to avoid blocking auth state propagation
            setTimeout(() => {
              import("@/lib/offline/sync").then(({ syncNow }) => {
                syncNow().then(() => {
                  try { localStorage.setItem(seedKey, new Date().toISOString()); } catch {}
                }).catch(() => {});
              });
            }, 1500);
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshProfile(session.user.id).catch(() => setProfile(null));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile, updateProfileAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
