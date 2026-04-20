import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import {
  DEFAULT_REPORT_CARD_SETTINGS,
  ReportCardSettings,
  DepartmentReportColors,
  useReportCardSettings,
  useSaveReportCardSettings,
  useDepartmentReportColors,
  useSaveDepartmentReportColors,
  useDeleteDepartmentReportColors,
} from "@/hooks/useReportCardSettings";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

export const ReportCardSettingsTab = () => {
  const { school } = useSchool();
  const { data: loaded, isLoading } = useReportCardSettings();
  const save = useSaveReportCardSettings();
  const { toast } = useToast();

  const [form, setForm] = useState<ReportCardSettings>(DEFAULT_REPORT_CARD_SETTINGS);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [sealFile, setSealFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (loaded) setForm(loaded);
  }, [loaded]);

  const set = <K extends keyof ReportCardSettings>(k: K, v: ReportCardSettings[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const uploadAsset = async (file: File, prefix: string): Promise<string> => {
    const path = `${school!.id}/${prefix}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("school-assets")
      .upload(path, file, { upsert: true });
    if (upErr) throw upErr;
    return supabase.storage.from("school-assets").getPublicUrl(path).data.publicUrl;
  };

  const handleSave = async () => {
    try {
      let logo_url = form.logo_url;
      let seal_url = form.seal_url;
      let admin_signature_url = form.admin_signature_url;
      if ((logoFile || sealFile || signatureFile) && school?.id) {
        setUploading(true);
        if (logoFile) logo_url = await uploadAsset(logoFile, "report-logo");
        if (sealFile) seal_url = await uploadAsset(sealFile, "report-seal");
        if (signatureFile) admin_signature_url = await uploadAsset(signatureFile, "admin-signature");
      }
      await save.mutateAsync({ ...form, logo_url, seal_url, admin_signature_url });
      toast({ title: "Saved", description: "Report card settings updated." });
      setLogoFile(null);
      setSealFile(null);
      setSignatureFile(null);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleResetColors = () => {
    if (window.confirm("Reset all report card colors to system defaults? This will affect all departments using school defaults.")) {
      setForm((prev) => ({
        ...prev,
        header_bg_color: DEFAULT_REPORT_CARD_SETTINGS.header_bg_color,
        accent_color: DEFAULT_REPORT_CARD_SETTINGS.accent_color,
        secondary_bg_color: DEFAULT_REPORT_CARD_SETTINGS.secondary_bg_color,
        header_chip_color: DEFAULT_REPORT_CARD_SETTINGS.header_chip_color,
        general_average_text_color: DEFAULT_REPORT_CARD_SETTINGS.general_average_text_color,
        header_meta_text_color: DEFAULT_REPORT_CARD_SETTINGS.header_meta_text_color,
      }));
      toast({ title: "Colors reset", description: "All colors reverted to system defaults. Click Save to apply." });
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
          <CardTitle>Report Card Colors</CardTitle>
          <CardDescription>
            Pick colors that match your school brand. Each department can override these
            below — useful when Kindergarten, Primary, and High School should each have
            their own look.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorRow
            label="Header background"
            help="Top banner, section bars, and the General Average box."
            value={form.header_bg_color}
            onChange={(v) => set("header_bg_color", v)}
          />
          <ColorRow
            label="Accent (highlight)"
            help="Year-end column, period & semester chips, and the General Average number."
            value={form.accent_color}
            onChange={(v) => set("accent_color", v)}
          />
          <ColorRow
            label="Secondary (exam columns)"
            help="Background of the exam columns inside the grades table."
            value={form.secondary_bg_color}
            onChange={(v) => set("secondary_bg_color", v)}
          />
          <ColorRow
            label="General Average text"
            help="Text color of the big number and grade label inside the General Average box."
            value={form.general_average_text_color}
            onChange={(v) => set("general_average_text_color", v)}
          />
          <ColorRow
            label="Header chips text"
            help="Text color for the REPORT TYPE and SEMESTER chips in the top-right of the header."
            value={form.header_meta_text_color}
            onChange={(v) => set("header_meta_text_color", v)}
          />
          <ColorRow
            label="Header chips background"
            help="Background color for the REPORT TYPE and SEMESTER chips in the header."
            value={form.header_chip_color}
            onChange={(v) => set("header_chip_color", v)}
          />
          <ReportColorPreview
            header={form.header_bg_color}
            accent={form.accent_color}
            secondary={form.secondary_bg_color}
            chipBg={form.header_chip_color}
          />
        </CardContent>
      </Card>

      <DepartmentColorsCard schoolDefaults={form} />

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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {([
              ["grade_a_label", "A label"],
              ["grade_b_label", "B label"],
              ["grade_c_label", "C label"],
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
            Tip: thresholds must be in descending order (A &gt; B &gt; C). Anything below the F threshold
            is a failing grade. Pass mark is the minimum average required to be promoted at year end.
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
          <CardDescription>
            Pre-filled on every report card; teachers can still edit per student.
            The administrator signature image is shown as a faint watermark behind the
            administrator name on the left signature line only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Official school seal */}
          <div className="space-y-2">
            <Label>Official school seal</Label>
            <div className="flex items-center gap-4">
              {(sealFile || form.seal_url) ? (
                <img
                  src={sealFile ? URL.createObjectURL(sealFile) : form.seal_url!}
                  alt="seal"
                  className="h-16 w-16 rounded object-contain border bg-white"
                />
              ) : (
                <div className="h-16 w-16 rounded border flex items-center justify-center text-xs text-muted-foreground">
                  No seal
                </div>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setSealFile(e.target.files?.[0] ?? null)}
                />
                <span className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-accent">
                  <Upload className="h-4 w-4" /> {sealFile ? sealFile.name : "Choose seal image"}
                </span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Shown between the two signature lines. Leave empty to hide it.
            </p>
          </div>

          {/* Administrator signature image */}
          <div className="space-y-2">
            <Label>Administrator signature (watermark)</Label>
            <div className="flex items-center gap-4">
              {(signatureFile || form.admin_signature_url) ? (
                <img
                  src={signatureFile ? URL.createObjectURL(signatureFile) : form.admin_signature_url!}
                  alt="signature"
                  className="h-16 w-32 rounded object-contain border bg-white"
                />
              ) : (
                <div className="h-16 w-32 rounded border flex items-center justify-center text-xs text-muted-foreground">
                  No signature
                </div>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setSignatureFile(e.target.files?.[0] ?? null)}
                />
                <span className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-accent">
                  <Upload className="h-4 w-4" /> {signatureFile ? signatureFile.name : "Choose signature image"}
                </span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Appears faintly behind the administrator (left) signature line. PNG with transparent background works best.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Administrator role label</Label>
              <Input
                value={form.administrator_role_label ?? ""}
                placeholder="e.g. Principal, Administrator"
                onChange={(e) => set("administrator_role_label", e.target.value || "Administrator")}
              />
            </div>
            <div className="space-y-2">
              <Label>Administrator subtitle (optional)</Label>
              <Input
                value={form.administrator_subtitle ?? ""}
                placeholder="e.g. School Sponsor"
                onChange={(e) => set("administrator_subtitle", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Class teacher role label</Label>
              <Input
                value={form.class_teacher_role_label ?? ""}
                placeholder="e.g. Class Teacher, Homeroom Teacher"
                onChange={(e) => set("class_teacher_role_label", e.target.value || "Class Teacher")}
              />
            </div>
            <div className="space-y-2">
              <Label>Class teacher subtitle (optional)</Label>
              <Input
                value={form.class_teacher_subtitle ?? ""}
                placeholder="e.g. Teacher Signature"
                onChange={(e) => set("class_teacher_subtitle", e.target.value || null)}
              />
            </div>
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

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleResetColors}
          className="gap-2"
          type="button"
        >
          <RotateCcw className="h-4 w-4" /> Reset colors to default
        </Button>
        <Button onClick={handleSave} disabled={save.isPending || uploading} className="gap-2">
          {(save.isPending || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" /> Save report card settings
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// Color picker row
// ============================================================================
const ColorRow = ({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3 items-center">
    <Label className="md:text-right">{label}</Label>
    <div className="flex items-center gap-3 flex-wrap">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 rounded border cursor-pointer bg-transparent p-0"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#1a2a6e"
        className="font-mono w-32"
      />
      {help && <span className="text-xs text-muted-foreground">{help}</span>}
    </div>
  </div>
);

// ============================================================================
// Live preview swatch
// ============================================================================
const ReportColorPreview = ({
  header,
  accent,
  secondary,
  chipBg,
}: {
  header: string;
  accent: string;
  secondary: string;
  chipBg?: string;
}) => (
  <div className="rounded-md border overflow-hidden">
    <div style={{ background: header, color: "#fff", padding: "10px 14px", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
      REPORT CARD HEADER
    </div>
    <div className="flex items-stretch text-xs">
      <div style={{ background: secondary, color: "#fff", padding: "10px 14px", fontWeight: 600, flex: 1, textAlign: "center" }}>
        EXAM COLUMN
      </div>
      <div style={{ background: accent, color: "#fff", padding: "10px 14px", fontWeight: 700, flex: 1, textAlign: "center" }}>
        YEAR AVERAGE
      </div>
    </div>
    {chipBg && (
      <div className="flex gap-2 p-2" style={{ background: '#f8f9fa' }}>
        <div style={{ background: chipBg, color: '#000', padding: '4px 10px', fontSize: 10, fontWeight: 700, borderRadius: 3 }}>REPORT TYPE</div>
        <div style={{ background: chipBg, color: '#000', padding: '4px 10px', fontSize: 10, fontWeight: 700, borderRadius: 3 }}>SEMESTER</div>
      </div>
    )}
  </div>
);

// ============================================================================
// Per-department color overrides
// ============================================================================
const DepartmentColorsCard = ({
  schoolDefaults,
}: {
  schoolDefaults: ReportCardSettings;
}) => {
  const { school } = useSchool();
  const { data: depts = [] } = useQuery({
    queryKey: ["departments-for-colors", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .eq("school_id", school!.id)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: overrides = [] } = useDepartmentReportColors();
  const saveOverride = useSaveDepartmentReportColors();
  const deleteOverride = useDeleteDepartmentReportColors();
  const { toast } = useToast();

  const findOverride = (deptId: string): DepartmentReportColors | undefined =>
    overrides.find((o) => o.department_id === deptId);

  const handleSave = async (deptId: string, patch: Partial<DepartmentReportColors>) => {
    const existing = findOverride(deptId);
    const next: DepartmentReportColors = {
      department_id: deptId,
      header_bg_color: existing?.header_bg_color ?? schoolDefaults.header_bg_color,
      accent_color: existing?.accent_color ?? schoolDefaults.accent_color,
      secondary_bg_color: existing?.secondary_bg_color ?? schoolDefaults.secondary_bg_color,
      header_chip_color: existing?.header_chip_color ?? schoolDefaults.header_chip_color,
      general_average_text_color:
        existing?.general_average_text_color ?? schoolDefaults.general_average_text_color,
      header_meta_text_color:
        existing?.header_meta_text_color ?? schoolDefaults.header_meta_text_color,
      ...patch,
    };
    try {
      await saveOverride.mutateAsync(next);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const handleReset = async (deptId: string) => {
    try {
      await deleteOverride.mutateAsync(deptId);
      toast({ title: "Reset", description: "Department now uses school colors." });
    } catch (e: any) {
      toast({ title: "Reset failed", description: e.message, variant: "destructive" });
    }
  };

  if (!depts.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-Department Colors</CardTitle>
        <CardDescription>
          Override report card colors for a specific department. Leave a department alone
          to keep using your school-wide colors above.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {depts.map((d: any) => {
          const ov = findOverride(d.id);
          const header = ov?.header_bg_color ?? schoolDefaults.header_bg_color;
          const accent = ov?.accent_color ?? schoolDefaults.accent_color;
          const secondary = ov?.secondary_bg_color ?? schoolDefaults.secondary_bg_color;
          const chipBg = ov?.header_chip_color ?? schoolDefaults.header_chip_color;
          const genAvgText =
            ov?.general_average_text_color ?? schoolDefaults.general_average_text_color;
          const metaText =
            ov?.header_meta_text_color ?? schoolDefaults.header_meta_text_color;
          const isCustom = !!ov;
          return (
            <div key={d.id} className="border rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {isCustom ? "Custom colors" : "Using school defaults"}
                  </div>
                </div>
                {isCustom && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-destructive"
                    onClick={() => handleReset(d.id)}
                    disabled={deleteOverride.isPending}
                  >
                    <Trash2 className="h-4 w-4" /> Reset
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <DeptColorField
                  label="Header"
                  value={header}
                  onCommit={(v) => handleSave(d.id, { header_bg_color: v })}
                />
                <DeptColorField
                  label="Accent"
                  value={accent}
                  onCommit={(v) => handleSave(d.id, { accent_color: v })}
                />
                <DeptColorField
                  label="Secondary"
                  value={secondary}
                  onCommit={(v) => handleSave(d.id, { secondary_bg_color: v })}
                />
                <DeptColorField
                  label="General Average text"
                  value={genAvgText}
                  onCommit={(v) => handleSave(d.id, { general_average_text_color: v })}
                />
                <DeptColorField
                  label="Header chips text"
                  value={metaText}
                  onCommit={(v) => handleSave(d.id, { header_meta_text_color: v })}
                />
                <DeptColorField
                  label="Header chips bg"
                  value={chipBg}
                  onCommit={(v) => handleSave(d.id, { header_chip_color: v })}
                />
              </div>
              <ReportColorPreview header={header} accent={accent} secondary={secondary} chipBg={chipBg} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

const DeptColorField = ({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}) => {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={(e) => e.target.value !== value && onCommit(e.target.value)}
          className="h-9 w-12 rounded border cursor-pointer bg-transparent p-0"
        />
        <Input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => local !== value && /^#[0-9a-fA-F]{6}$/.test(local) && onCommit(local)}
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
};
