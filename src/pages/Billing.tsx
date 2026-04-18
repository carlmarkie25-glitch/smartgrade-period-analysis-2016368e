import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Loader2, Sparkles, ExternalLink, AlertTriangle } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { useSubscription } from "@/hooks/useSubscription";
import { initializePaddle, getPaddlePriceId, paddleEnvironment } from "@/lib/paddle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: "starter" | "pro" | "premium";
  productId: string;
  priceId: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    productId: "starter_plan",
    priceId: "starter_monthly",
    name: "Starter",
    price: "$19",
    description: "Essentials to run your school",
    features: ["Students & enrollment", "Gradebook", "Report cards", "Custom branding"],
  },
  {
    id: "pro",
    productId: "pro_plan",
    priceId: "pro_monthly",
    name: "Pro",
    price: "$49",
    description: "Add scheduling and analytics",
    features: ["Everything in Starter", "Analytics dashboard", "Class schedule", "Academic calendar"],
    highlight: true,
  },
  {
    id: "premium",
    productId: "premium_plan",
    priceId: "premium_monthly",
    name: "Premium",
    price: "$99",
    description: "The full platform",
    features: ["Everything in Pro", "Finance & billing", "Messaging & notifications", "Priority support"],
  },
];

export default function Billing() {
  const { user } = useAuth();
  const { school } = useSchool();
  const { subscription, isActive, refetch } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [params, setParams] = useSearchParams();

  const currentProductId = subscription?.product_id;

  // After Paddle redirects back, refetch a few times — webhook delivery is async.
  useEffect(() => {
    if (params.get("checkout") !== "success") return;
    toast.success("Subscription activated! Updating your account…");
    let tries = 0;
    const interval = setInterval(() => {
      refetch();
      tries += 1;
      if (tries >= 6) clearInterval(interval); // ~12s
    }, 2000);
    const next = new URLSearchParams(params);
    next.delete("checkout");
    setParams(next, { replace: true });
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewCheckout = async (plan: Plan) => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    setLoadingPlan(plan.id);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(plan.priceId);

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: {
          userId: user.id,
          schoolId: school?.id ?? "",
        },
        settings: {
          displayMode: "overlay",
          successUrl: `${window.location.origin}/settings/billing?checkout=success`,
          allowLogout: false,
          variant: "one-page",
        },
        eventCallback: (ev: any) => {
          if (ev?.name === "checkout.completed") {
            setTimeout(() => refetch(), 2000);
            toast.success("Subscription activated!");
          }
        },
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to open checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSwapPlan = async (plan: Plan) => {
    setLoadingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("change-subscription", {
        body: { newPriceId: plan.priceId, environment: paddleEnvironment() },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success(`Switched to ${plan.name}. Charge prorated.`);
      setTimeout(() => refetch(), 2000);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to change plan");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSubscribeClick = (plan: Plan) => {
    if (isActive && subscription) {
      handleSwapPlan(plan);
    } else {
      handleNewCheckout(plan);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal-session", {
        body: { environment: paddleEnvironment() },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      const url = data?.overviewUrl;
      if (!url) throw new Error("No portal URL returned");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to open portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Choose your plan</h1>
          <p className="text-muted-foreground">
            {isActive
              ? `You're on the ${subscription?.product_id?.replace("_plan", "") ?? ""} plan.`
              : "Pick a plan to unlock features after your trial."}
          </p>
        </div>

        {subscription?.cancel_at_period_end && subscription.current_period_end && (
          <Card className="p-4 border-destructive/50 bg-destructive/5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Your subscription is set to cancel.</p>
              <p className="text-sm text-muted-foreground">
                Access continues until {new Date(subscription.current_period_end).toLocaleDateString()}.
                Reactivate from the customer portal.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={openPortal} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage"}
            </Button>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentProductId === plan.productId && isActive;
            const ctaLabel = loadingPlan === plan.id
              ? null
              : isCurrent
                ? "Current plan"
                : isActive
                  ? `Switch to ${plan.name}`
                  : `Subscribe to ${plan.name}`;
            return (
              <Card
                key={plan.id}
                className={`p-6 flex flex-col gap-4 relative ${
                  plan.highlight ? "border-primary border-2 shadow-lg" : ""
                }`}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Sparkles className="h-3 w-3 mr-1" /> Most popular
                  </Badge>
                )}
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div>
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribeClick(plan)}
                  disabled={isCurrent || loadingPlan === plan.id}
                  variant={plan.highlight ? "default" : "outline"}
                  className="w-full"
                >
                  {loadingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : ctaLabel}
                </Button>
              </Card>
            );
          })}
        </div>

        {subscription && (
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-2">Subscription details</h3>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium capitalize">{subscription.status}</dd>
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd className="font-medium">{subscription.product_id}</dd>
                  {subscription.current_period_end && (
                    <>
                      <dt className="text-muted-foreground">
                        {subscription.cancel_at_period_end ? "Access ends" : "Renews"}
                      </dt>
                      <dd className="font-medium">
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
              <Button onClick={openPortal} disabled={portalLoading} variant="outline">
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage subscription
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The customer portal opens in a new tab. Use it to update your payment method, view invoices, or cancel.
            </p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
