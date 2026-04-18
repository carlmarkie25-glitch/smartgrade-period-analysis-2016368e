import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Users, DollarSign, AlertTriangle, TrendingUp, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// Rough per-seat pricing for MRR estimate (matches mem://billing/per-seat-pricing tiers)
const TIER_PRICE_PER_SEAT: Record<string, number> = {
  basic: 1,
  pro: 2,
  enterprise: 3,
};

const STATUS_COLORS: Record<string, string> = {
  active: "hsl(var(--success))",
  trialing: "hsl(var(--primary))",
  past_due: "hsl(var(--warning))",
  canceled: "hsl(var(--destructive))",
};

const LOCK_COLORS: Record<string, string> = {
  none: "hsl(var(--success))",
  soft: "hsl(var(--warning))",
  hard: "hsl(var(--destructive))",
};

export const PlatformMetrics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["platform-metrics"],
    queryFn: async () => {
      const [schoolsRes, paymentsRes] = await Promise.all([
        supabase
          .from("schools")
          .select(
            "id, created_at, subscription_tier, subscription_status, lockout_state, billable_student_count, max_students, trial_ends_at"
          ),
        supabase
          .from("student_payments")
          .select("amount, payment_date")
          .gte("payment_date", new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)),
      ]);
      if (schoolsRes.error) throw schoolsRes.error;
      return {
        schools: schoolsRes.data ?? [],
        payments: paymentsRes.data ?? [],
      };
    },
  });

  const metrics = useMemo(() => {
    const schools = data?.schools ?? [];
    const total = schools.length;
    const active = schools.filter((s) => s.subscription_status === "active").length;
    const trialing = schools.filter((s) => s.subscription_status === "trialing").length;
    const pastDue = schools.filter((s) => s.subscription_status === "past_due").length;
    const canceled = schools.filter((s) => s.subscription_status === "canceled").length;
    const lockedSoft = schools.filter((s) => s.lockout_state === "soft").length;
    const lockedHard = schools.filter((s) => s.lockout_state === "hard").length;

    const totalSeats = schools.reduce((s, sc) => s + (sc.billable_student_count || 0), 0);
    const totalCapacity = schools.reduce((s, sc) => s + (sc.max_students || 0), 0);

    const mrr = schools
      .filter((s) => s.subscription_status === "active")
      .reduce((sum, s) => {
        const price = TIER_PRICE_PER_SEAT[s.subscription_tier] ?? 0;
        return sum + price * (s.billable_student_count || 0);
      }, 0);

    const now = Date.now();
    const trialEndingSoon = schools.filter(
      (s) =>
        s.subscription_status === "trialing" &&
        s.trial_ends_at &&
        new Date(s.trial_ends_at).getTime() - now < 7 * 86400000 &&
        new Date(s.trial_ends_at).getTime() - now > 0
    );

    // Signups by month (last 12 months)
    const monthBuckets: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets[key] = 0;
    }
    schools.forEach((s) => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthBuckets) monthBuckets[key]++;
    });
    const signupsByMonth = Object.entries(monthBuckets).map(([month, count]) => ({
      month: month.slice(5),
      schools: count,
    }));

    const statusPie = [
      { name: "Active", value: active, color: STATUS_COLORS.active },
      { name: "Trialing", value: trialing, color: STATUS_COLORS.trialing },
      { name: "Past due", value: pastDue, color: STATUS_COLORS.past_due },
      { name: "Canceled", value: canceled, color: STATUS_COLORS.canceled },
    ].filter((s) => s.value > 0);

    const lockPie = [
      { name: "Healthy", value: total - lockedSoft - lockedHard, color: LOCK_COLORS.none },
      { name: "Soft lock", value: lockedSoft, color: LOCK_COLORS.soft },
      { name: "Hard lock", value: lockedHard, color: LOCK_COLORS.hard },
    ].filter((s) => s.value > 0);

    // Trial conversion (very rough — % of schools created >14d ago that are now active)
    const eligibleForConversion = schools.filter(
      (s) => new Date(s.created_at).getTime() < now - 14 * 86400000
    );
    const converted = eligibleForConversion.filter((s) => s.subscription_status === "active").length;
    const conversionRate = eligibleForConversion.length
      ? Math.round((converted / eligibleForConversion.length) * 100)
      : 0;

    const seatUtil = totalCapacity ? Math.round((totalSeats / totalCapacity) * 100) : 0;

    return {
      total, active, trialing, pastDue, canceled,
      lockedSoft, lockedHard,
      totalSeats, totalCapacity, seatUtil,
      mrr, trialEndingSoon, signupsByMonth, statusPie, lockPie, conversionRate,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Building2 className="h-4 w-4" />} label="Total schools" value={metrics.total.toString()} />
        <Kpi icon={<CheckCircle2 className="h-4 w-4 text-success" />} label="Active" value={metrics.active.toString()} />
        <Kpi icon={<Clock className="h-4 w-4 text-primary" />} label="Trialing" value={metrics.trialing.toString()} sub={`${metrics.trialEndingSoon.length} ending in 7d`} />
        <Kpi icon={<DollarSign className="h-4 w-4 text-success" />} label="Est. MRR" value={`$${metrics.mrr.toLocaleString()}`} sub="active × tier × seats" />
        <Kpi icon={<Users className="h-4 w-4" />} label="Billable seats" value={metrics.totalSeats.toLocaleString()} sub={`${metrics.seatUtil}% utilization`} />
        <Kpi icon={<TrendingUp className="h-4 w-4 text-success" />} label="Trial conversion" value={`${metrics.conversionRate}%`} sub="trial → active" />
        <Kpi icon={<AlertTriangle className="h-4 w-4 text-warning" />} label="Past due" value={metrics.pastDue.toString()} />
        <Kpi icon={<XCircle className="h-4 w-4 text-destructive" />} label="Hard locked" value={metrics.lockedHard.toString()} sub={`${metrics.lockedSoft} soft`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School signups (last 12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.signupsByMonth}>
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                    }}
                  />
                  <Bar dataKey="schools" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.statusPie} dataKey="value" nameKey="name" outerRadius={80} label>
                    {metrics.statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lockout health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.lockPie} dataKey="value" nameKey="name" outerRadius={80} label>
                    {metrics.lockPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trials ending in 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.trialEndingSoon.length === 0 ? (
              <p className="text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="space-y-2">
                {metrics.trialEndingSoon.map((s: any) => (
                  <li key={s.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <span className="font-medium">{s.name ?? s.id.slice(0, 8)}</span>
                    <Badge variant="outline">
                      {Math.ceil((new Date(s.trial_ends_at).getTime() - Date.now()) / 86400000)}d left
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Kpi = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </CardContent>
  </Card>
);
