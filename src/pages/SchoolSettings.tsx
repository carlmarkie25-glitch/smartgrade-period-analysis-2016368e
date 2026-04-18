import { useEffect, useState } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Building2, Sparkles } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

export default function SchoolSettings() {
  const { school, refresh } = useSchool();
  const { toast } = useToast();
  const { plan, status, trialDaysLeft } = useFeatureAccess();

  const [form, setForm] = useState({
    name: "", address: "", phone: "", email: "", website: "",
    primary_color: "#0d9488", country: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name ?? "",
        address: school.address ?? "",
        phone: school.phone ?? "",
        email: school.email ?? "",
        website: school.website ?? "",
        primary_color: school.primary_color ?? "#0d9488",
        country: school.country ?? "",
      });
    }
  }, [school]);

  const save = async () => {
    if (!school) return;
    setSaving(true);
    try {
      let logo_url = school.logo_url;
      if (logoFile) {
        const path = `${school.id}/logo-${Date.now()}-${logoFile.name}`;
        const { error: upErr } = await supabase.storage.from("school-assets").upload(path, logoFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("school-assets").getPublicUrl(path);
        logo_url = data.publicUrl;
      }
      const { error } = await supabase.from("schools").update({ ...form, logo_url }).eq("id", school.id);
      if (error) throw error;
      await refresh();
      toast({ title: "Saved", description: "School settings updated." });
      setLogoFile(null);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell activeTab="settings">
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold">School Settings</h1>
          <p className="text-muted-foreground">Manage your school's branding, contact info, and subscription.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Subscription</span>
              <Badge variant={status === "active" ? "default" : "secondary"} className="capitalize">
                {plan} • {status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {status === "trialing"
                ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial.`
                : status === "active" ? "Your subscription is active." : "Update billing to restore access."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>Manage billing (coming soon)</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> School Profile</CardTitle>
            <CardDescription>Used in report cards, the sidebar, and emails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>School logo</Label>
              <div className="flex items-center gap-4">
                {school?.logo_url && <img src={school.logo_url} alt="logo" className="h-16 w-16 rounded object-cover border" />}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                  <span className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-accent">
                    <Upload className="h-4 w-4" /> {logoFile ? logoFile.name : "Choose file"}
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>School name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Primary color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="h-10 w-16 rounded border cursor-pointer"
                />
                <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="max-w-[160px]" />
              </div>
            </div>

            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
