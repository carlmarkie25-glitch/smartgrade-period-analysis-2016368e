import { useSchool } from "@/contexts/SchoolContext";
import { useSubscription } from "@/hooks/useSubscription";

export type Feature =
  | "students" | "grades" | "reports" | "analytics"
  | "schedule" | "calendar" | "finance" | "messaging"
  | "branding" | "attendance" | "api";

export type Tier = "basic" | "standard" | "premium";

// PRD §3 feature matrix
const PLAN_FEATURES: Record<Tier, Feature[]> = {
  basic: ["students", "grades", "reports"],
  standard: ["students", "grades", "reports", "analytics", "branding", "schedule", "calendar"],
  premium: [
    "students", "grades", "reports", "analytics", "branding",
    "schedule", "calendar", "attendance", "finance", "messaging", "api",
  ],
};

// New per-seat product IDs
const TIER_FROM_PRODUCT: Record<string, Tier> = {
  basic_plan: "basic",
  standard_plan: "standard",
  premium_plan_v2: "premium",
  // Legacy mapping (grandfathered schools)
  starter_plan: "basic",
  pro_plan: "standard",
  premium_plan: "premium",
};

// Legacy school.subscription_plan label → tier (grandfathered)
const TIER_FROM_LEGACY_PLAN: Record<string, Tier> = {
  starter: "basic",
  pro: "standard",
  premium_plan: "premium",
  premium: "premium",
  basic: "basic",
  standard: "standard",
};

export const useFeatureAccess = () => {
  const { school } = useSchool();
  const { subscription, isActive } = useSubscription();

  // Prefer the live subscription's product, fall back to school.subscription_tier (set by migration), then legacy plan label
  const tier: Tier = subscription?.product_id
    ? (TIER_FROM_PRODUCT[subscription.product_id] ?? "basic")
    : ((school as any)?.subscription_tier as Tier)
      ?? TIER_FROM_LEGACY_PLAN[school?.subscription_plan ?? "basic"]
      ?? "basic";

  const trialEndsAt = school?.trial_ends_at ? new Date(school.trial_ends_at) : null;
  const trialActive = !!trialEndsAt && trialEndsAt.getTime() > Date.now();
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Lockout state (set by webhook + scheduled job)
  const lockoutState = ((school as any)?.lockout_state ?? "none") as
    "none" | "past_due" | "locked" | "suspended";

  // Effective status
  let status: "trialing" | "active" | "past_due" | "locked" | "canceled" | "suspended" | "expired" = "expired";
  if (trialActive && !isActive) status = "trialing";
  else if (isActive && lockoutState === "past_due") status = "past_due";
  else if (isActive) status = subscription?.status === "trialing" ? "trialing" : "active";
  else if (lockoutState === "suspended") status = "suspended";
  else if (lockoutState === "locked") status = "locked";
  else status = "expired";

  // Read-only when locked; full block when suspended
  const readOnly = lockoutState === "locked";
  const blocked = lockoutState === "suspended";
  const hasAccess = !blocked && (isActive || trialActive || lockoutState === "past_due" || lockoutState === "locked");

  const has = (feature: Feature) => {
    if (!hasAccess) return false;
    if (trialActive && !isActive) return true; // trial unlocks all
    return (PLAN_FEATURES[tier] ?? PLAN_FEATURES.basic).includes(feature);
  };

  return {
    tier,
    plan: tier, // back-compat alias
    status,
    trialing: status === "trialing",
    trialDaysLeft,
    hasAccess,
    readOnly,
    blocked,
    lockoutState,
    has,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
    periodEnd: subscription?.current_period_end ?? null,
  };
};
