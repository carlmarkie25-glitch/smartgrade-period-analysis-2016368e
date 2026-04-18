import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

const PLANS = [
  { id: "starter", name: "Starter", price: "$0.799", desc: "Up to 200 students" },
  { id: "pro", name: "Pro", price: "$1.299", desc: "Up to 1,000 students" },
  { id: "premium", name: "Premium", price: "$2.00", desc: "Unlimited students" },
];

export default function Signup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [school, setSchool] = useState({ name: "", country: "", phone: "", address: "" });
  const [admin, setAdmin] = useState({ full_name: "", email: "", password: "" });
  const [plan, setPlan] = useState(params.get("plan") || "pro");

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("register-school", {
        body: {
          school_name: school.name,
          country: school.country,
          phone: school.phone,
          address: school.address,
          admin_full_name: admin.full_name,
          admin_email: admin.email,
          admin_password: admin.password,
          plan,
        },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);

      // Auto sign in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: admin.email, password: admin.password,
      });
      if (signInErr) throw signInErr;

      toast({ title: "Welcome to Lumini!", description: "Your school workspace is ready." });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Signup failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const canNext =
    (step === 1 && school.name.trim()) ||
    (step === 2 && admin.full_name && admin.email && admin.password.length >= 6) ||
    (step === 3 && plan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <Card className="p-8">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  s < step ? "bg-primary text-primary-foreground" :
                  s === step ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 4 && <div className={`flex-1 h-0.5 mx-2 ${s < step ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">Tell us about your school</h2>
                <p className="text-sm text-muted-foreground">We'll set up your workspace.</p>
              </div>
              <div className="space-y-2">
                <Label>School name *</Label>
                <Input value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} placeholder="Springfield High" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={school.country} onChange={(e) => setSchool({ ...school, country: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={school.phone} onChange={(e) => setSchool({ ...school, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={school.address} onChange={(e) => setSchool({ ...school, address: e.target.value })} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">Create your admin account</h2>
                <p className="text-sm text-muted-foreground">You'll be the first administrator of {school.name}.</p>
              </div>
              <div className="space-y-2">
                <Label>Full name *</Label>
                <Input value={admin.full_name} onChange={(e) => setAdmin({ ...admin, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={admin.email} onChange={(e) => setAdmin({ ...admin, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password * <span className="text-xs text-muted-foreground">(min 6 chars)</span></Label>
                <Input type="password" value={admin.password} onChange={(e) => setAdmin({ ...admin, password: e.target.value })} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">Choose your plan</h2>
                <p className="text-sm text-muted-foreground">14-day free trial on every plan. No credit card required.</p>
              </div>
              <div className="space-y-3">
                {PLANS.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPlan(p.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      plan === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm text-muted-foreground">{p.desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{p.price}</div>
                        <div className="text-xs text-muted-foreground">/ student / year</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">Confirm & launch</h2>
                <p className="text-sm text-muted-foreground">Review your details before we set things up.</p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 rounded bg-muted/50">
                  <span className="text-muted-foreground">School</span><span className="font-medium">{school.name}</span>
                </div>
                <div className="flex justify-between p-3 rounded bg-muted/50">
                  <span className="text-muted-foreground">Admin</span><span className="font-medium">{admin.full_name} ({admin.email})</span>
                </div>
                <div className="flex justify-between p-3 rounded bg-muted/50">
                  <span className="text-muted-foreground">Plan</span><span className="font-medium capitalize">{plan} • 14-day trial</span>
                </div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={back} disabled={step === 1 || loading}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < 4 ? (
              <Button onClick={next} disabled={!canNext}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create my school
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
