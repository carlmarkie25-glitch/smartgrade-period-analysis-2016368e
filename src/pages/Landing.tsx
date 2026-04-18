import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, GraduationCap, BarChart3, Wallet, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";

const tiers = [
  {
    name: "Starter",
    price: "$0.799",
    unit: "/ student / year",
    desc: "Essentials for small schools getting started.",
    features: ["Up to 200 students", "Gradebook & reports", "Student & parent portal", "Email support"],
    cta: "Start free trial",
    plan: "starter",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$1.299",
    unit: "/ student / year",
    desc: "For growing schools needing finance & scheduling.",
    features: ["Up to 1,000 students", "Everything in Starter", "Finance & billing", "Class scheduling", "Analytics dashboard"],
    cta: "Start free trial",
    plan: "pro",
    highlight: true,
  },
  {
    name: "Premium",
    price: "$2.00",
    unit: "/ student / year",
    desc: "Unlimited scale with all Lumini features.",
    features: ["Unlimited students", "Everything in Pro", "Attendance tracking", "In-app messaging", "Priority support"],
    cta: "Start free trial",
    plan: "premium",
    highlight: false,
  },
];

const features = [
  { icon: GraduationCap, title: "Gradebook & Reports", desc: "Period grades, class ranking, beautiful printable report cards." },
  { icon: Wallet, title: "Finance & Billing", desc: "Fee structures, automated bills, receipts, expenses." },
  { icon: CalendarDays, title: "Academic Calendar", desc: "Years, semesters, periods, and events all in one place." },
  { icon: BarChart3, title: "Analytics", desc: "Performance trends, demographics, pass/fail insights." },
  { icon: ShieldCheck, title: "Role-based Access", desc: "Admins, teachers, students, and parents — each see what they need." },
  { icon: Sparkles, title: "Multi-tenant SaaS", desc: "Each school's data is fully isolated and secure." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/50 backdrop-blur sticky top-0 z-40 bg-background/80">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">L</div>
            Lumini
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
            <Link to="/auth" className="hover:text-foreground transition">Sign in</Link>
          </nav>
          <Button asChild><Link to="/signup">Get started</Link></Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
          <Sparkles className="h-3 w-3" /> School management, simplified
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Run your school <span className="text-primary">brilliantly</span>.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Lumini brings grading, attendance, finance, scheduling, and parent communication into one beautifully simple platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild><Link to="/signup">Start 14-day free trial</Link></Button>
          <Button size="lg" variant="outline" asChild><a href="#pricing">See pricing</a></Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">No credit card required.</p>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything your school needs</h2>
          <p className="text-muted-foreground">One platform. Every role. Every workflow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Simple per-student pricing</h2>
          <p className="text-muted-foreground">Annual billing. 14-day free trial on every plan.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((t) => (
            <Card key={t.name} className={`p-8 relative ${t.highlight ? "border-primary shadow-lg scale-[1.02]" : ""}`}>
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Most popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{t.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.unit}</span>
              </div>
              <Button className="w-full mb-6" variant={t.highlight ? "default" : "outline"} asChild>
                <Link to={`/signup?plan=${t.plan}`}>{t.cta}</Link>
              </Button>
              <ul className="space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20">
        <Card className="p-12 text-center bg-primary text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Ready to run your school brilliantly?</h2>
          <p className="opacity-90 mb-8">Join schools transforming their operations with Lumini.</p>
          <Button size="lg" variant="secondary" asChild><Link to="/signup">Start your free trial</Link></Button>
        </Card>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Lumini. All rights reserved.
      </footer>
    </div>
  );
}
