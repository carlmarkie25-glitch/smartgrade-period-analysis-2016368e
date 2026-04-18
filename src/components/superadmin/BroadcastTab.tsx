import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Send } from "lucide-react";

type School = {
  id: string;
  name: string;
  subscription_tier: string;
  subscription_status: string;
  lockout_state: string;
};

type Props = { schools: School[] };

type Audience = "all" | "trialing" | "active" | "past_due" | "locked" | "by_tier";
type TargetRole = "all" | "admin" | "teacher" | "student" | "parent";

export const BroadcastTab = ({ schools }: Props) => {
  const { toast } = useToast();
  const [audience, setAudience] = useState<Audience>("all");
  const [tier, setTier] = useState<string>("basic");
  const [targetRole, setTargetRole] = useState<TargetRole>("all");
  const [type, setType] = useState<string>("announcement");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const filteredSchools = useMemo(() => {
    switch (audience) {
      case "all": return schools;
      case "trialing": return schools.filter((s) => s.subscription_status === "trialing");
      case "active": return schools.filter((s) => s.subscription_status === "active");
      case "past_due": return schools.filter((s) => s.subscription_status === "past_due");
      case "locked": return schools.filter((s) => s.lockout_state !== "none");
      case "by_tier": return schools.filter((s) => s.subscription_tier === tier);
    }
  }, [schools, audience, tier]);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Missing fields", description: "Title and message are required.", variant: "destructive" });
      return;
    }
    if (filteredSchools.length === 0) {
      toast({ title: "No recipients", description: "No schools match this audience.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const rows = filteredSchools.map((s) => ({
        school_id: s.id,
        title: title.trim(),
        message: message.trim(),
        type,
        target_role: targetRole,
      }));

      const { error } = await (supabase as any).from("notifications").insert(rows);
      if (error) throw error;

      await supabase.rpc("write_audit_log" as any, {
        p_action: "broadcast.sent",
        p_entity_type: "notification",
        p_entity_id: null,
        p_metadata: {
          audience,
          tier: audience === "by_tier" ? tier : null,
          target_role: targetRole,
          type,
          title: title.trim(),
          school_count: filteredSchools.length,
        } as any,
      });

      toast({
        title: "Broadcast sent",
        description: `Delivered to ${filteredSchools.length} school(s).`,
      });
      setTitle("");
      setMessage("");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" /> Cross-school broadcast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Send a notification to one or more schools at once. Recipients see it in their in-app inbox.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schools</SelectItem>
                <SelectItem value="trialing">Trialing only</SelectItem>
                <SelectItem value="active">Active subscribers</SelectItem>
                <SelectItem value="past_due">Past-due accounts</SelectItem>
                <SelectItem value="locked">Locked / suspended</SelectItem>
                <SelectItem value="by_tier">Filter by tier…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {audience === "by_tier" && (
            <div>
              <Label>Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">basic</SelectItem>
                  <SelectItem value="pro">pro</SelectItem>
                  <SelectItem value="enterprise">enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Target role (within each school)</Label>
            <Select value={targetRole} onValueChange={(v) => setTargetRole(v as TargetRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="parent">Parents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled maintenance Saturday 22:00 UTC"
          />
        </div>

        <div>
          <Label>Message</Label>
          <Textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write the full announcement here…"
          />
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Will deliver to </span>
            <Badge variant="secondary">{filteredSchools.length} school{filteredSchools.length === 1 ? "" : "s"}</Badge>
          </div>
          <Button onClick={send} disabled={sending}>
            <Send className="h-4 w-4 mr-1" /> {sending ? "Sending…" : "Send broadcast"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
