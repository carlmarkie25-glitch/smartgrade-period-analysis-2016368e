import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const TrialBanner = () => {
  const { trialing, trialDaysLeft, status } = useFeatureAccess();

  if (status === "suspended") {
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm flex items-center justify-between">
        <span>Your account is suspended. Please update your billing to restore access.</span>
        <Link to="/settings/billing" className="underline font-medium">Manage billing</Link>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm flex items-center justify-between">
        <span>Your trial has ended. Subscribe to keep using the app.</span>
        <Link to="/settings/billing" className="underline font-medium">Choose a plan</Link>
      </div>
    );
  }

  if (!trialing) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-sm flex items-center justify-between">
      <span className="flex items-center gap-2 text-foreground">
        <Clock className="h-4 w-4 text-primary" />
        <strong>{trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"}</strong> left in your free trial
      </span>
      <Link to="/settings/billing" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
        <Sparkles className="h-4 w-4" /> Upgrade
      </Link>
    </div>
  );
};
