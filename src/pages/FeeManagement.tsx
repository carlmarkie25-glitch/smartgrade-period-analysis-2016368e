import { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, DollarSign, Calendar, ClipboardList } from "lucide-react";
import { useFeeCategories, useCreateFeeCategory, useDeleteFeeCategory, useDivisionFeeRates, useUpsertDivisionFeeRate, useInstallmentPlans, useUpsertInstallmentPlan } from "@/hooks/useFeeSetup";
import { useFeeAssignments, useCreateFeeAssignment } from "@/hooks/useFinance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FeeManagement = () => {
  const { data: categories, isLoading: catLoading } = useFeeCategories();
  const createCategory = useCreateFeeCategory();
  const deleteCategory = useDeleteFeeCategory();

  const { data: years } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data } = await supabase.from("academic_years").select("*").order("start_date", { ascending: false });
      return data || [];
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await supabase.from("departments").select("*").order("name");
      return data || [];
    },
  });

  const currentYear = years?.find(y => y.is_current);
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    if (currentYear && !selectedYear) setSelectedYear(currentYear.id);
  }, [currentYear, selectedYear]);

  const { data: rates } = useDivisionFeeRates(selectedYear);
  const upsertRate = useUpsertDivisionFeeRate();
  const { data: installments } = useInstallmentPlans(selectedYear);
  const upsertInstallment = useUpsertInstallmentPlan();

  const [newCatName, setNewCatName] = useState("");
  const [catOpen, setCatOpen] = useState(false);

  // Local editable state for the fee matrix
  const [rateEdits, setRateEdits] = useState<Record<string, number>>({});
  const [installEdits, setInstallEdits] = useState<Record<string, { label: string; period_label: string; amount: number }>>({});
  const [installmentRows, setInstallmentRows] = useState<{ num: number; label: string; period_label: string }[]>([
    { num: 1, label: "1st Installment", period_label: "October - December" },
    { num: 2, label: "2nd Installment", period_label: "January - February" },
    { num: 3, label: "3rd Installment", period_label: "March - May" },
  ]);
  const [regPeriod, setRegPeriod] = useState("July - September");

  // Build rate lookup: `${categoryId}_${deptId}` -> amount
  const rateLookup = useMemo(() => {
    const map: Record<string, number> = {};
    rates?.forEach((r: any) => {
      map[`${r.fee_category_id}_${r.department_id}`] = r.amount;
    });
    return { ...map, ...rateEdits };
  }, [rates, rateEdits]);

  const getRateValue = (catId: string, deptId: string) => {
    const key = `${catId}_${deptId}`;
    return rateEdits[key] ?? rateLookup[key] ?? 0;
  };

  const setRateValue = (catId: string, deptId: string, val: number) => {
    setRateEdits(prev => ({ ...prev, [`${catId}_${deptId}`]: val }));
  };

  // Calculate column totals
  const getColumnTotal = (deptId: string) => {
    return categories?.reduce((sum, cat) => sum + getRateValue(cat.id, deptId), 0) || 0;
  };

  const handleSaveRates = async () => {
    const promises = Object.entries(rateEdits).map(([key, amount]) => {
      const [fee_category_id, department_id] = key.split("_");
      return upsertRate.mutateAsync({ fee_category_id, department_id, academic_year_id: selectedYear, amount });
    });
    await Promise.all(promises);
    setRateEdits({});
    toast.success("Fee rates saved successfully");
  };

  // Installment management
  const installLookup = useMemo(() => {
    const map: Record<string, any> = {};
    installments?.forEach((i: any) => {
      map[`${i.department_id}_${i.installment_number}`] = i;
    });
    return map;
  }, [installments]);

  const getInstallValue = (deptId: string, num: number) => {
    const key = `${deptId}_${num}`;
    const edit = installEdits[key];
    const existing = installLookup[key];
    return edit ?? (existing ? { label: existing.label, period_label: existing.period_label, amount: existing.amount } : { label: "", period_label: "", amount: 0 });
  };

  const setInstallValue = (deptId: string, num: number, field: string, val: any) => {
    const key = `${deptId}_${num}`;
    const current = getInstallValue(deptId, num);
    setInstallEdits(prev => ({ ...prev, [key]: { ...current, [field]: val } }));
  };

  // Sync installment rows from saved data
  useEffect(() => {
    if (installments && installments.length > 0) {
      const sorted = [...installments].sort((a: any, b: any) => a.installment_number - b.installment_number);
      const uniqueRows = sorted.reduce((acc: any[], inst: any) => {
        if (!acc.find(r => r.num === inst.installment_number)) {
          acc.push({ num: inst.installment_number, label: inst.label, period_label: inst.period_label });
        }
        return acc;
      }, []);
      if (uniqueRows.length > 0) setInstallmentRows(uniqueRows);
    }
  }, [installments]);

  const addInstallmentRow = () => {
    const nextNum = installmentRows.length > 0 ? Math.max(...installmentRows.map(r => r.num)) + 1 : 1;
    setInstallmentRows(prev => [...prev, { num: nextNum, label: `${nextNum}${nextNum === 1 ? 'st' : nextNum === 2 ? 'nd' : nextNum === 3 ? 'rd' : 'th'} Installment`, period_label: "" }]);
  };

  const removeInstallmentRow = (num: number) => {
    setInstallmentRows(prev => prev.filter(r => r.num !== num));
  };

  const updateInstallmentRowMeta = (num: number, field: "label" | "period_label", val: string) => {
    setInstallmentRows(prev => prev.map(r => r.num === num ? { ...r, [field]: val } : r));
  };

  const handleSaveInstallments = async () => {
    const promises = Object.entries(installEdits).map(([key, vals]) => {
      const [department_id, numStr] = key.split("_");
      const installment_number = parseInt(numStr);
      const defaults = installmentDefaults[installment_number - 1];
      return upsertInstallment.mutateAsync({
        department_id,
        academic_year_id: selectedYear,
        installment_number,
        label: vals.label || defaults.label,
        period_label: vals.period_label || defaults.period_label,
        amount: vals.amount,
      });
    });
    await Promise.all(promises);
    setInstallEdits({});
    toast.success("Installment plans saved successfully");
  };

  const getTuitionTotal = (deptId: string) => {
    return installmentNumbers.reduce((sum, num) => sum + (getInstallValue(deptId, num).amount || 0), 0);
  };

  const getGrandTotal = (deptId: string) => {
    return getColumnTotal(deptId) + getTuitionTotal(deptId);
  };

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fee Management</h1>
            <p className="text-muted-foreground">Set fee standards by division and manage installment plans</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {years?.map(y => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.year_name} {y.is_current ? "(Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="requirements">
          <TabsList>
            <TabsTrigger value="requirements"><ClipboardList className="h-4 w-4 mr-1" /> Requirements & Registration</TabsTrigger>
            <TabsTrigger value="installments"><Calendar className="h-4 w-4 mr-1" /> Payment Installments</TabsTrigger>
            <TabsTrigger value="categories"><DollarSign className="h-4 w-4 mr-1" /> Fee Categories</TabsTrigger>
          </TabsList>

          {/* Requirements & Registration Matrix */}
          <TabsContent value="requirements" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Requirements & Registration Fees by Division</CardTitle>
                {Object.keys(rateEdits).length > 0 && (
                  <Button onClick={handleSaveRates} disabled={upsertRate.isPending} size="sm">
                    <Save className="h-4 w-4 mr-1" /> Save Changes
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-bold min-w-[180px]">Requirements & Registration</TableHead>
                        {departments?.map(dept => (
                          <TableHead key={dept.id} className="text-center font-bold min-w-[130px]">{dept.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catLoading ? (
                        <TableRow><TableCell colSpan={(departments?.length || 0) + 1} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                      ) : categories?.map(cat => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          {departments?.map(dept => (
                            <TableCell key={dept.id} className="text-center p-1">
                              <Input
                                type="number"
                                className="text-center h-8 w-full"
                                value={getRateValue(cat.id, dept.id) || ""}
                                onChange={e => setRateValue(cat.id, dept.id, parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {/* Total row */}
                      <TableRow className="bg-destructive/10 font-bold border-t-2">
                        <TableCell className="font-bold text-destructive">Total</TableCell>
                        {departments?.map(dept => (
                          <TableCell key={dept.id} className="text-center font-bold text-destructive">
                            {getColumnTotal(dept.id).toLocaleString()}LD
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Installments */}
          <TabsContent value="installments" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Tuition Payment Installment Plan</CardTitle>
                {Object.keys(installEdits).length > 0 && (
                  <Button onClick={handleSaveInstallments} disabled={upsertInstallment.isPending} size="sm">
                    <Save className="h-4 w-4 mr-1" /> Save Changes
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-bold min-w-[180px]">Payment Duration</TableHead>
                        {departments?.map(dept => (
                          <TableHead key={dept.id} className="text-center font-bold min-w-[130px]">{dept.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Registration row - read only from requirements total */}
                      <TableRow className="bg-muted/30">
                        <TableCell className="font-medium">
                          <div>Registration / Requirements</div>
                          <div className="text-xs text-muted-foreground">July - September</div>
                        </TableCell>
                        {departments?.map(dept => (
                          <TableCell key={dept.id} className="text-center font-medium">
                            {getColumnTotal(dept.id).toLocaleString()}LD
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Installment rows */}
                      {installmentNumbers.map(num => (
                        <TableRow key={num}>
                          <TableCell className="font-medium">
                            <div>{installmentDefaults[num - 1].label}</div>
                            <div className="text-xs text-muted-foreground">{installmentDefaults[num - 1].period_label}</div>
                          </TableCell>
                          {departments?.map(dept => (
                            <TableCell key={dept.id} className="text-center p-1">
                              <Input
                                type="number"
                                className="text-center h-8 w-full"
                                value={getInstallValue(dept.id, num).amount || ""}
                                onChange={e => setInstallValue(dept.id, num, "amount", parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}

                      {/* Total Tuition */}
                      <TableRow className="bg-muted/30 border-t">
                        <TableCell className="font-bold">Total Tuition</TableCell>
                        {departments?.map(dept => (
                          <TableCell key={dept.id} className="text-center font-bold">
                            {getTuitionTotal(dept.id).toLocaleString()}LD
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Grand Total */}
                      <TableRow className="bg-destructive/10 font-bold border-t-2">
                        <TableCell className="font-bold text-destructive">Grand Total (Reg. + Tuition)</TableCell>
                        {departments?.map(dept => (
                          <TableCell key={dept.id} className="text-center font-bold text-destructive">
                            {getGrandTotal(dept.id).toLocaleString()}LD
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Categories Management */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={catOpen} onOpenChange={setCatOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> Add Fee Category</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Fee Category</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Name</Label><Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Lab Fees" /></div>
                    <Button
                      onClick={() => {
                        createCategory.mutate({ name: newCatName, display_order: (categories?.length || 0) + 1 }, {
                          onSuccess: () => { setCatOpen(false); setNewCatName(""); }
                        });
                      }}
                      disabled={!newCatName}
                      className="w-full"
                    >Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories?.map(cat => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell>{cat.display_order}</TableCell>
                        <TableCell><Badge variant={cat.is_registration ? "default" : "secondary"}>{cat.is_registration ? "Registration" : "Custom"}</Badge></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteCategory.mutate(cat.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default FeeManagement;
