import { useSchool } from "@/contexts/SchoolContext";
import { useSubscription } from "@/hooks/useSubscription";

export type Feature =
  | "students" | "grades" | "reports" | "analytics"
  | "schedule" | "calendar" | "finance" | "messaging" | "branding";

const PLAN_FEATURES: Record<string, Feature[]> = {
  starter: ["students", "grades", "reports", "branding"],
  pro: ["students", "grades", "reports", "analytics", "schedule", "calendar", "branding"],
  premium: ["students", "grades", "reports", "analytics", "schedule", "calendar", "finance", "messaging", "branding"],
};

const PLAN_FROM_PRODUCT: Record<string, "starter" | "pro" | "premium"> = {
  starter_plan: "starter",
  pro_plan: "pro",
  premium_plan: "premium",
};

export const useFeatureAccess = () => {
  const { school } = useSchool();
  const { subscription, isActive } = useSubscription();

  // Prefer the live subscriptions row over the mirrored school field.
  const plan = subscription?.product_id
    ? (PLAN_FROM_PRODUCT[subscription.product_id] ?? "starter")
    : (school?.subscription_plan as "starter" | "pro" | "premium") ?? "starter";

  const trialEndsAt = school?.trial_ends_at ? new Date(school.trial_ends_at) : null;
  const trialActive = !!trialEndsAt && trialEndsAt.getTime() > Date.now();
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Effective status. Trial wins while it's still going.
  let status: "trialing" | "active" | "canceled" | "suspended" | "expired" = "expired";
  if (trialActive && !isActive) status = "trialing";
  else if (isActive) status = subscription?.status === "trialing" ? "trialing" : "active";
  else if (school?.subscription_status === "suspended") status = "suspended";
  else status = "expired"; // trial over + no active sub

  const hasAccess = isActive || trialActive;

  const has = (feature: Feature) => {
    if (!hasAccess) return false;
    if (trialActive && !isActive) return true; // trial unlocks all
    return (PLAN_FEATURES[plan] ?? PLAN_FEATURES.starter).includes(feature);
  };

  return {
    plan,
    status,
    trialing: status === "trialing",
    trialDaysLeft,
    hasAccess,        // user can use the app at all
    has,              // per-feature check
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
    periodEnd: subscription?.current_period_end ?? null,
  };
};
