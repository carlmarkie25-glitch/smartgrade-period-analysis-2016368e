import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { useAcademicPeriods, useBulkUpsertPeriods, DEFAULT_PERIODS } from "@/hooks/useAcademicPeriods";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PeriodForm {
  period_type: string;
  label: string;
  semester: string;
  start_date: string;
  end_date: string;
  display_order: number;
}

export const AcademicPeriodManagement = () => {
  const { data: periods, isLoading } = useAcademicPeriods();
  const bulkUpsert = useBulkUpsertPeriods();

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase.from("academic_years").select("*").order("is_current", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const currentYear = academicYears?.find((y) => y.is_current) || academicYears?.[0];

  const [forms, setForms] = useState<PeriodForm[]>([]);

  useEffect(() => {
    const initial = DEFAULT_PERIODS.map((dp) => {
      const existing = periods?.find((p) => p.period_type === dp.period_type);
      return {
        period_type: dp.period_type,
        label: existing?.label || dp.label,
        semester: existing?.semester || dp.semester,
        start_date: existing?.start_date || "",
        end_date: existing?.end_date || "",
        display_order: dp.display_order,
      };
    });
    setForms(initial);
  }, [periods]);

  const updateForm = (index: number, field: keyof PeriodForm, value: string) => {
    setForms((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  const handleSaveAll = () => {
    if (!currentYear) return;
    const payload = forms
      .filter((f) => f.start_date && f.end_date)
      .map((f) => ({
        ...f,
        academic_year_id: currentYear.id,
      }));
    bulkUpsert.mutate(payload);
  };

  const semester1 = forms.filter((f) => f.semester === "semester1");
  const semester2 = forms.filter((f) => f.semester === "semester2");

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Academic Period Dates</CardTitle>
          <CardDescription>
            Set the date ranges for each period in the academic year
            {currentYear && <Badge variant="secondary" className="ml-2">{currentYear.year_name}</Badge>}
          </CardDescription>
        </div>
        <Button onClick={handleSaveAll} disabled={bulkUpsert.isPending || !currentYear}>
          <Save className="h-4 w-4 mr-2" /> Save All
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {!currentYear && (
          <p className="text-destructive text-sm">Please create an academic year first in Settings.</p>
        )}

        {[
          { label: "Semester 1", periods: semester1 },
          { label: "Semester 2", periods: semester2 },
        ].map((sem) => (
          <div key={sem.label}>
            <h3 className="text-lg font-semibold mb-3 text-foreground">{sem.label}</h3>
            <div className="space-y-3">
              {sem.periods.map((f) => {
                const idx = forms.indexOf(f);
                return (
                  <div key={f.period_type} className="grid grid-cols-[1fr_1fr_1fr] gap-3 items-end p-3 rounded-lg border bg-muted/30">
                    <div>
                      <Label className="text-xs text-muted-foreground">Period</Label>
                      <Input
                        value={f.label}
                        onChange={(e) => updateForm(idx, "label", e.target.value)}
                        className="font-medium"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Start Date</Label>
                      <Input
                        type="date"
                        value={f.start_date}
                        onChange={(e) => updateForm(idx, "start_date", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">End Date</Label>
                      <Input
                        type="date"
                        value={f.end_date}
                        onChange={(e) => updateForm(idx, "end_date", e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
