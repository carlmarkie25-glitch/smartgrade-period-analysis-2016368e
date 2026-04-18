import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { paddleEnvironment } from "@/lib/paddle";

export interface Subscription {
  id: string;
  user_id: string;
  school_id: string | null;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const env = paddleEnvironment();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["subscription", user?.id, env],
    enabled: !!user?.id,
    queryFn: async (): Promise<Subscription | null> => {
      // Auto-expire stale (cancelled-and-past-period) subscriptions before reading.
      await supabase.rpc("expire_stale_subscription_for_user", { p_user_id: user!.id });

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("environment", env)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  // Realtime: refetch when the user's subscription row changes (webhook update).
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`subscription:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["subscription", user.id, env] });
          qc.invalidateQueries({ queryKey: ["school"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, env, qc]);

  const sub = query.data;
  const isActive = !!sub &&
    ["active", "trialing"].includes(sub.status) &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

  return { ...query, subscription: sub, isActive };
};
