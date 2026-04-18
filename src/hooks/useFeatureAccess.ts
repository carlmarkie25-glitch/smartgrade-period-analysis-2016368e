import { useSchool } from "@/contexts/SchoolContext";

export type Feature =
  | "students" | "grades" | "reports" | "analytics"
  | "schedule" | "calendar" | "finance" | "messaging" | "branding";

const PLAN_FEATURES: Record<string, Feature[]> = {
  starter: ["students", "grades", "reports", "branding"],
  pro: ["students", "grades", "reports", "analytics", "schedule", "calendar", "branding"],
  premium: ["students", "grades", "reports", "analytics", "schedule", "calendar", "finance", "messaging", "branding"],
};

export const useFeatureAccess = () => {
  const { school } = useSchool();
  const plan = school?.subscription_plan ?? "starter";
  const status = school?.subscription_status ?? "trialing";
  const trialing = status === "trialing";

  const has = (feature: Feature) => {
    // During trial, unlock everything
    if (trialing) return true;
    if (status === "suspended" || status === "canceled") return false;
    return (PLAN_FEATURES[plan] ?? PLAN_FEATURES.starter).includes(feature);
  };

  const trialDaysLeft = (() => {
    if (!school?.trial_ends_at) return 0;
    const ms = new Date(school.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  })();

  return { plan, status, trialing, trialDaysLeft, has };
};
