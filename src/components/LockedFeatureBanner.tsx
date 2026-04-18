import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface Props {
  feature: string;
  requiredPlan: "pro" | "premium";
}

export const LockedFeatureBanner = ({ feature, requiredPlan }: Props) => (
  <Card className="p-8 text-center border-2 border-dashed">
    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
      <Lock className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-xl font-bold mb-2">{feature} is locked</h3>
    <p className="text-muted-foreground mb-6">
      Upgrade to <span className="font-semibold capitalize text-foreground">{requiredPlan}</span> to unlock this feature.
    </p>
    <Button asChild>
      <Link to="/settings/billing">
        <Sparkles className="h-4 w-4 mr-2" /> Upgrade plan
      </Link>
    </Button>
  </Card>
);
