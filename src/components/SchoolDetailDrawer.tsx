import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, GraduationCap, DollarSign, Activity, Mail, Phone, Globe, MapPin, ShieldAlert, Loader2 } from "lucide-react";

type School = {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  subscription_status: string;
  lockout_state: string;
  trial_ends_at: string | null;
  max_students: number;
  billable_student_count: number;
  created_at: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  country?: string | null;
  owner_user_id?: string | null;
};

type Props = {
  school: School | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

const lockColor: Record<string, string> = {
  none: "bg-success/15 text-success",
  soft: "bg-warning/15 text-warning",
  hard: "bg-destructive/15 text-destructive",
};

export const SchoolDetailDrawer = ({ school, open, onOpenChange }: Props) => {
  const schoolId = school?.id;
  const queryClient = useQueryClient();

  const [subStatus, setSubStatus] = useState(school?.subscription_status ?? "trialing");
  const [lockState, setLockState] = useState(school?.lockout_state ?? "none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSubStatus(school?.subscription_status ?? "trialing");
    setLockState(school?.lockout_state ?? "none");
  }, [school?.id, school?.subscription_status, school?.lockout_state]);

  const dirty =
    subStatus !== (school?.subscription_status ?? "trialing") ||
    lockState !== (school?.lockout_state ?? "none");

  const handleSaveOverride = async () => {
    if (!school) return;
    setSaving(true);
    const { error } = await supabase
      .from("schools")
      .update({
        subscription_status: subStatus,
        lockout_state: lockState,
        lockout_started_at: lockState === "none" ? null : new Date().toISOString(),
      })
      .eq("id", school.id);

    if (error) {
      toast.error("Override failed", { description: error.message });
      setSaving(false);
      return;
    }

    await supabase.rpc("write_audit_log", {
      p_action: "super_admin.school.manual_override",
      p_entity_type: "school",
      p_entity_id: school.id,
      p_metadata: {
        school_name: school.name,
        previous: { subscription_status: school.subscription_status, lockout_state: school.lockout_state },
        next: { subscription_status: subStatus, lockout_state: lockState },
      },
    });

    toast.success("School updated");
    queryClient.invalidateQueries({ queryKey: ["schools"] });
    queryClient.invalidateQueries({ queryKey: ["school-detail", school.id] });
    setSaving(false);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["school-detail", schoolId],
    enabled: !!schoolId && open,
    queryFn: async () => {
      const [
        usersRes,
        studentsRes,
        paymentsRes,
        billsRes,
        recentAuditRes,
        ownerRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", schoolId!),
        supabase.from("students").select("is_active", { count: "exact" }).eq("school_id", schoolId!),
        supabase
          .from("student_payments")
          .select("amount, payment_date")
          .eq("school_id", schoolId!)
          .order("payment_date", { ascending: false })
          .limit(500),
        supabase
          .from("student_bills")
          .select("grand_total, amount_paid, balance")
          .eq("school_id", schoolId!),
        supabase
          .from("audit_logs")
          .select("id, action, entity_type, created_at, metadata")
          .eq("school_id", schoolId!)
          .order("created_at", { ascending: false })
          .limit(10),
        school?.owner_user_id
          ? supabase.from("profiles").select("full_name, email").eq("user_id", school.owner_user_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const students = studentsRes.data ?? [];
      const activeStudents = students.filter((s: any) => s.is_active).length;
      const inactiveStudents = students.length - activeStudents;

      const payments = paymentsRes.data ?? [];
      const totalCollected = payments.reduce((sum, p: any) => sum + Number(p.amount || 0), 0);
      const last30 = payments
        .filter((p: any) => {
          const d = new Date(p.payment_date);
          return d >= new Date(Date.now() - 30 * 86400000);
        })
        .reduce((s, p: any) => s + Number(p.amount || 0), 0);

      const bills = billsRes.data ?? [];
      const outstanding = bills.reduce((s, b: any) => s + Number(b.balance || 0), 0);

      return {
        userCount: usersRes.count ?? 0,
        activeStudents,
        inactiveStudents,
        totalCollected,
        last30,
        outstanding,
        recentAudit: recentAuditRes.data ?? [],
        owner: (ownerRes as any).data,
      };
    },
  });

  if (!school) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {school.name}
            <Badge className={lockColor[school.lockout_state] ?? ""}>{school.lockout_state}</Badge>
          </SheetTitle>
          <SheetDescription>
            {school.slug} · created {new Date(school.created_at).toLocaleDateString()}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Subscription */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Subscription</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Tier</div>
                <Badge variant="outline">{school.subscription_tier}</Badge>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Status</div>
                <Badge variant="secondary">{school.subscription_status}</Badge>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Seats</div>
                <div className="font-medium">
                  {school.billable_student_count} / {school.max_students}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Trial ends</div>
                <div className="font-medium">
                  {school.trial_ends_at ? new Date(school.trial_ends_at).toLocaleDateString() : "—"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual override (super admin only) */}
          <Card className="border-warning/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warning" /> Manual override
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Force a subscription or lockout state. Use only for support cases — Paddle webhooks may overwrite this on the next billing event.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Subscription status</div>
                  <Select value={subStatus} onValueChange={setSubStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trialing">trialing</SelectItem>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="past_due">past_due</SelectItem>
                      <SelectItem value="canceled">canceled</SelectItem>
                      <SelectItem value="paused">paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Lockout state</div>
                  <Select value={lockState} onValueChange={setLockState}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">none</SelectItem>
                      <SelectItem value="soft">soft (read-only)</SelectItem>
                      <SelectItem value="hard">hard (login blocked)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" onClick={handleSaveOverride} disabled={!dirty || saving}>
                {saving ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : null}
                Save override
              </Button>
            </CardContent>
          </Card>


          {(school.email || school.phone || school.website || school.address) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {school.email && (
                  <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" />{school.email}</div>
                )}
                {school.phone && (
                  <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" />{school.phone}</div>
                )}
                {school.website && (
                  <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-muted-foreground" />{school.website}</div>
                )}
                {school.address && (
                  <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground" />{school.address}{school.country ? `, ${school.country}` : ""}</div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Users"
              value={isLoading ? null : String(data?.userCount ?? 0)}
            />
            <StatCard
              icon={<GraduationCap className="h-4 w-4" />}
              label="Students (active / inactive)"
              value={isLoading ? null : `${data?.activeStudents ?? 0} / ${data?.inactiveStudents ?? 0}`}
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Total collected"
              value={isLoading ? null : (data?.totalCollected ?? 0).toLocaleString()}
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Last 30 days"
              value={isLoading ? null : (data?.last30 ?? 0).toLocaleString()}
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Outstanding balance"
              value={isLoading ? null : (data?.outstanding ?? 0).toLocaleString()}
            />
            {data?.owner && (
              <StatCard
                icon={<Users className="h-4 w-4" />}
                label="Owner"
                value={data.owner.full_name ?? data.owner.email ?? "—"}
              />
            )}
          </div>

          {/* Recent activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" /> Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (data?.recentAudit?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data!.recentAudit.map((l: any) => (
                    <li key={l.id} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
                      <div>
                        <Badge variant="outline" className="mr-2">{l.action}</Badge>
                        <span className="text-xs text-muted-foreground">{l.entity_type}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) => (
  <Card>
    <CardContent className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      {value === null ? <Skeleton className="h-5 w-16" /> : <div className="font-semibold text-base">{value}</div>}
    </CardContent>
  </Card>
);
