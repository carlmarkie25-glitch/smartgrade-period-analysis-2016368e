import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, Loader2, Sparkles, ExternalLink, AlertTriangle, Users, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { TrialBanner } from "@/components/TrialBanner";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useBillableSeats, MIN_SEATS } from "@/hooks/useBillableSeats";
import { initializePaddle, getPaddlePriceId, paddleEnvironment } from "@/lib/paddle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TierId = "basic" | "standard" | "premium";

interface Plan {
  id: TierId;
  productId: string;
  priceId: string;
  name: string;
  perStudent: number; // dollars per student per year
  description: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "basic",
    productId: "basic_plan",
    priceId: "basic_yearly",
    name: "Basic",
    perStudent: 0.8,
    description: "Essentials to run your school",
    features: [
      "Student records & enrollment",
      "Gradebook & grade entry",
      "Standard report cards",
      "Email support",
    ],
  },
  {
    id: "standard",
    productId: "standard_plan",
    priceId: "standard_yearly",
    name: "Standard",
    perStudent: 1.3,
    description: "Adds analytics, branding & scheduling",
    features: [
      "Everything in Basic",
      "Analytics dashboards",
      "Custom school branding",
      "Class schedule & academic calendar",
    ],
    highlight: true,
  },
  {
    id: "premium",
    productId: "premium_plan_v2",
    priceId: "premium_yearly",
    name: "Premium",
    perStudent: 2.0,
    description: "Full platform incl. attendance & finance",
    features: [
      "Everything in Standard",
      "Attendance tracking",
      "Finance, billing & receipts",
      "Messaging & notifications",
      "API access & priority support",
    ],
  },
];

// Map any product_id (legacy or new) to TierId
const productToTier = (productId?: string | null): TierId | null => {
  if (!productId) return null;
  const map: Record<string, TierId> = {
    basic_plan: "basic", standard_plan: "standard", premium_plan_v2: "premium",
    starter_plan: "basic", pro_plan: "standard", premium_plan: "premium",
  };
  return map[productId] ?? null;
};

const formatMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export default function Billing() {
  const { user } = useAuth();
  const { school } = useSchool();
  const { subscription, isActive, refetch } = useSubscription();
  const { data: seats, isLoading: seatsLoading } = useBillableSeats();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [params, setParams] = useSearchParams();

  const currentTier = productToTier(subscription?.product_id);
  const billableSeats = seats?.billable ?? MIN_SEATS;
  const activeSeats = seats?.active ?? 0;

  useEffect(() => {
    if (params.get("checkout") !== "success") return;
    toast.success("Subscription activated! Updating your account…");
    let tries = 0;
    const interval = setInterval(() => {
      refetch();
      tries += 1;
      if (tries >= 6) clearInterval(interval);
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
        items: [{ priceId: paddlePriceId, quantity: billableSeats }],
        customer: user.email ? { email: user.email } : undefined,
        customData: {
          userId: user.id,
          schoolId: school?.id ?? "",
          tier: plan.id,
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
        body: {
          newPriceId: plan.priceId,
          quantity: billableSeats,
          environment: paddleEnvironment(),
        },
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
            Pay per active student, billed annually. 50-student minimum.
          </p>
        </div>

        {/* Seat counter */}
        <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {seatsLoading ? "Counting students…" : `${activeSeats} active student${activeSeats === 1 ? "" : "s"}`}
              </p>
              <p className="text-sm text-muted-foreground">
                Billed for <span className="font-medium text-foreground">{billableSeats}</span> seats
                {activeSeats < MIN_SEATS && ` (50-seat minimum)`}
              </p>
            </div>
          </div>
        </Card>

        {subscription?.cancel_at_period_end && subscription.current_period_end && (
          <Card className="p-4 border-destructive/50 bg-destructive/5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Your subscription is set to cancel.</p>
              <p className="text-sm text-muted-foreground">
                Access continues until {new Date(subscription.current_period_end).toLocaleDateString()}.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={openPortal} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage"}
            </Button>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.id && isActive;
            const yearTotal = plan.perStudent * billableSeats;
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
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${plan.perStudent.toFixed(2)}</span>
                    <span className="text-muted-foreground text-sm">/student/year</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {billableSeats} × ${plan.perStudent.toFixed(2)} = <span className="font-semibold text-foreground">{formatMoney(yearTotal)}/yr</span>
                  </p>
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
                  <dd className="font-medium capitalize">{currentTier ?? subscription.product_id}</dd>
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
              Seat count is automatically updated 7 days before each renewal based on your active student roster.
            </p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
