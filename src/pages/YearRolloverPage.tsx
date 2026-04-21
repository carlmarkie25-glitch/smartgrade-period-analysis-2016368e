import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, RotateCw, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface Summary {
  promoted: number;
  graduated: number;
  retained: number;
  no_grades: number;
}

interface PreviewDetails {
  promoted: any[];
  graduated: any[];
  retained: any[];
  no_grades: any[];
}

const YearRolloverPage = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [passMark, setPassMark] = useState(60);
  const [preview, setPreview] = useState<{ summary: Summary; details: PreviewDetails } | null>(null);
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);

  const { data: years } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const callRollover = async (dry_run: boolean) => {
    if (!fromYear || !toYear) {
      toast({ title: "Select both years", variant: "destructive" });
      return;
    }
    if (fromYear === toYear) {
      toast({ title: "From and To year must differ", variant: "destructive" });
      return;
    }
    setBusy(dry_run ? "preview" : "apply");
    try {
      const { data, error } = await supabase.functions.invoke("year-rollover", {
        body: { from_year_id: fromYear, to_year_id: toYear, pass_mark: passMark, dry_run },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      if (dry_run) {
        setPreview({ summary: (data as any).summary, details: (data as any).preview });
        toast({ title: "Preview ready" });
      } else {
        toast({
          title: "Rollover complete",
          description: `${(data as any).summary.promoted} promoted, ${(data as any).summary.graduated} graduated, ${(data as any).summary.retained} retained.`,
        });
        setPreview(null);
        qc.invalidateQueries({ queryKey: ["academic-years"] });
        qc.invalidateQueries({ queryKey: ["students"] });
        qc.invalidateQueries({ queryKey: ["classes"] });
      }
    } catch (e: any) {
      toast({ title: "Rollover failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const apply = async () => {
    if (!confirm("This will move all passing students to the next class, graduate final-year passers, and retain failers. Continue?")) return;
    await callRollover(false);
  };

  return (
    <AppShell activeTab="years">
      <div className="py-4 space-y-6">
        <div className="neu-card p-6">
          <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
            <RotateCw className="h-7 w-7 text-primary" /> Year Rollover
          </h1>
          <p className="text-muted-foreground text-sm">
            Promote passing students to the next class, graduate final-year passers, and start the new year with fresh finance.
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>How it works</AlertTitle>
          <AlertDescription className="text-sm space-y-1 mt-2">
            <div>• Classes from the old year are cloned into the new year (same names, departments).</div>
            <div>• <strong>Passing students</strong> (average ≥ pass mark) are moved to the next class in their department.</div>
            <div>• Students in the <strong>final class</strong> who pass are marked as <strong>graduated</strong>.</div>
            <div>• Students who <strong>fail</strong> are kept in the same class (in the new year) to repeat.</div>
            <div>• <strong>Finance is fresh</strong> — no bills are copied. Set up new fee rates for the new year, then generate bills.</div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Choose source and destination years</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>From (old year)</Label>
                <Select value={fromYear} onValueChange={setFromYear}>
                  <SelectTrigger><SelectValue placeholder="Select source year" /></SelectTrigger>
                  <SelectContent>
                    {years?.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.year_name} {y.is_current && "(current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>To (new year)</Label>
                <Select value={toYear} onValueChange={setToYear}>
                  <SelectTrigger><SelectValue placeholder="Select destination year" /></SelectTrigger>
                  <SelectContent>
                    {years?.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.year_name} {y.is_current && "(current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="max-w-xs">
              <Label>Pass mark (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={passMark}
                onChange={(e) => setPassMark(Number(e.target.value))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => callRollover(true)} disabled={!!busy}>
                {busy === "preview" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Preview
              </Button>
              <Button onClick={apply} disabled={!!busy || !preview}>
                {busy === "apply" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Apply Rollover
              </Button>
            </div>
            {!preview && (
              <p className="text-xs text-muted-foreground">Run Preview first to see what will happen, then Apply.</p>
            )}
          </CardContent>
        </Card>

        {preview && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard label="Promoted" value={preview.summary.promoted} icon={ArrowRight} color="text-emerald-600" />
              <SummaryCard label="Graduated" value={preview.summary.graduated} icon={GraduationCap} color="text-blue-600" />
              <SummaryCard label="Retained" value={preview.summary.retained} icon={RotateCw} color="text-amber-600" />
              <SummaryCard label="No grades" value={preview.summary.no_grades} icon={AlertTriangle} color="text-muted-foreground" />
            </div>

            <DetailList title="Promoted to next class" items={preview.details.promoted} renderItem={(s) => (
              <span>{s.name} → <strong>{s.to_class_name}</strong> <Badge variant="secondary" className="ml-2">{s.average}%</Badge></span>
            )} />
            <DetailList title="Graduated (final class, passed)" items={preview.details.graduated} renderItem={(s) => (
              <span>{s.name} <Badge variant="secondary" className="ml-2">{s.average}%</Badge></span>
            )} />
            <DetailList title="Retained (will repeat)" items={preview.details.retained} renderItem={(s) => (
              <span>{s.name} — {s.class_name} <Badge variant="outline" className="ml-2">{s.average}%</Badge></span>
            )} />
            <DetailList title="No grades found" items={preview.details.no_grades} renderItem={(s) => (
              <span>{s.name} <span className="text-xs text-muted-foreground">(skipped)</span></span>
            )} />
          </>
        )}
      </div>
    </AppShell>
  );
};

const SummaryCard = ({ label, value, icon: Icon, color }: any) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </CardContent>
  </Card>
);

const DetailList = ({ title, items, renderItem }: { title: string; items: any[]; renderItem: (i: any) => React.ReactNode }) => {
  if (!items?.length) return null;
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          {title} <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="text-sm space-y-1 max-h-72 overflow-auto">
          {items.map((s, i) => (
            <li key={i} className="py-1 border-b border-border/40 last:border-0">{renderItem(s)}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default YearRolloverPage;
