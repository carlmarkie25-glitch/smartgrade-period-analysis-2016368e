import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import {
  DEFAULT_REPORT_CARD_SETTINGS,
  ReportCardSettings,
  useReportCardSettings,
  useSaveReportCardSettings,
} from "@/hooks/useReportCardSettings";

export const ReportCardSettingsTab = () => {
  const { school } = useSchool();
  const { data: loaded, isLoading } = useReportCardSettings();
  const save = useSaveReportCardSettings();
  const { toast } = useToast();

  const [form, setForm] = useState<ReportCardSettings>(DEFAULT_REPORT_CARD_SETTINGS);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (loaded) setForm(loaded);
  }, [loaded]);

  const set = <K extends keyof ReportCardSettings>(k: K, v: ReportCardSettings[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    try {
      let logo_url = form.logo_url;
      if (logoFile && school?.id) {
        setUploading(true);
        const path = `${school.id}/report-logo-${Date.now()}-${logoFile.name}`;
        const { error: upErr } = await supabase.storage
          .from("school-assets")
          .upload(path, logoFile, { upsert: true });
        if (upErr) throw upErr;
        logo_url = supabase.storage.from("school-assets").getPublicUrl(path).data.publicUrl;
      }
      await save.mutateAsync({ ...form, logo_url });
      toast({ title: "Saved", description: "Report card settings updated." });
      setLogoFile(null);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  const previewLogo = logoFile ? URL.createObjectURL(logoFile) : form.logo_url;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Card Header</CardTitle>
          <CardDescription>
            What appears at the top of every printed report card. Leave blank to use your school profile defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {previewLogo ? (
              <img src={previewLogo} alt="logo" className="h-16 w-16 rounded object-cover border" />
            ) : (
              <div className="h-16 w-16 rounded border flex items-center justify-center text-xs text-muted-foreground">
                No logo
              </div>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
              <span className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-accent">
                <Upload className="h-4 w-4" /> {logoFile ? logoFile.name : "Choose report card logo"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>School name (header title)</Label>
              <Input
                value={form.header_title ?? ""}
                placeholder={school?.name ?? "School name"}
                onChange={(e) => set("header_title", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tagline / subtitle</Label>
              <Input
                value={form.header_subtitle ?? ""}
                placeholder='e.g. "Knowledge • Character • Service"'
                onChange={(e) => set("header_subtitle", e.target.value || null)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address line</Label>
              <Input
                value={form.header_address ?? ""}
                placeholder={school?.address ?? "Address, City, Country"}
                onChange={(e) => set("header_address", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact (phone / email)</Label>
              <Input
                value={form.header_contact ?? ""}
                placeholder={school?.phone || school?.email || "(000) 000-0000"}
                onChange={(e) => set("header_contact", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={form.header_website ?? ""}
                placeholder={school?.website ?? "www.yourschool.edu"}
                onChange={(e) => set("header_website", e.target.value || null)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grading Standards</CardTitle>
          <CardDescription>
            Used to compute letter grades, the standing label (Excellent / Good / etc.), and pass/fail promotion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {([
              ["grade_a_min", "A min %"],
              ["grade_b_min", "B min %"],
              ["grade_c_min", "C min %"],
              ["grade_d_min", "F min %"],
              ["pass_mark", "Pass mark %"],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form[key] as number}
                  onChange={(e) => set(key, Number(e.target.value) as any)}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {([
              ["grade_a_label", "A label"],
              ["grade_b_label", "B label"],
              ["grade_c_label", "C label"],
              ["grade_d_label", "D label"],
              ["grade_f_label", "F label"],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  value={(form[key] as string) ?? ""}
                  onChange={(e) => set(key, e.target.value as any)}
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Tip: thresholds must be in descending order (A &gt; B &gt; C &gt; D). Pass mark is the minimum
            average required to be promoted at year end.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kindergarten Grading Labels</CardTitle>
          <CardDescription>
            Labels shown in the General Average box of Nursery / ABC / Kindergarten report cards.
            The letter scale (A+ 95–100, A 90–94, B+ 85–89, B 80–84, C+ 75–79, C 70–74, D 65–69, F 60–64)
            is fixed by the Liberian system — only the standing message is customizable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              ["kg_a_plus_label", "A+ label (95–100)"],
              ["kg_a_label",      "A label (90–94)"],
              ["kg_b_plus_label", "B+ label (85–89)"],
              ["kg_b_label",      "B label (80–84)"],
              ["kg_c_plus_label", "C+ label (75–79)"],
              ["kg_c_label",      "C label (70–74)"],
              ["kg_d_label",      "D label (65–69)"],
              ["kg_f_label",      "F label (60–64)"],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  value={(form[key] as string) ?? ""}
                  onChange={(e) => set(key, e.target.value as any)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Signatories & Footer</CardTitle>
          <CardDescription>Pre-filled on every report card; teachers can still edit per student.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default administrator name</Label>
              <Input
                value={form.default_administrator_name ?? ""}
                onChange={(e) => set("default_administrator_name", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Default class teacher name</Label>
              <Input
                value={form.default_class_teacher_name ?? ""}
                onChange={(e) => set("default_class_teacher_name", e.target.value || null)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Footer note (optional)</Label>
            <Textarea
              rows={2}
              value={form.footer_note ?? ""}
              placeholder='e.g. "This report is the property of the school."'
              onChange={(e) => set("footer_note", e.target.value || null)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={save.isPending || uploading} className="gap-2">
          {(save.isPending || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" /> Save report card settings
        </Button>
      </div>
    </div>
  );
};
