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
import { Plus, Trash2, Save, DollarSign, Calendar, ClipboardList, Zap } from "lucide-react";
import { useFeeCategories, useCreateFeeCategory, useDeleteFeeCategory, useDivisionFeeRates, useUpsertDivisionFeeRate, useInstallmentPlans, useUpsertInstallmentPlan } from "@/hooks/useFeeSetup";
import { useGenerateAllBills } from "@/hooks/useStudentBilling";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FeeManagement = () => {
  const { data: categories, isLoading: catLoading } = useFeeCategories();
  const createCategory = useCreateFeeCategory();
  const generateBills = useGenerateAllBills();
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
    if (!selectedYear) {
      if (currentYear) {
        setSelectedYear(currentYear.id);
      } else if (years?.length) {
        setSelectedYear(years[0].id);
      }
    }
  }, [currentYear, years, selectedYear]);

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
    const promises: Promise<void>[] = [];
    for (const row of installmentRows) {
      departments?.forEach(dept => {
        const val = getInstallValue(dept.id, row.num);
        promises.push(upsertInstallment.mutateAsync({
          department_id: dept.id,
          academic_year_id: selectedYear,
          installment_number: row.num,
          label: row.label,
          period_label: row.period_label,
          amount: val.amount || 0,
        }));
      });
    }
    await Promise.all(promises);
    setInstallEdits({});
    toast.success("Installment plans saved successfully");
  };

  const getTuitionTotal = (deptId: string) => {
    return installmentRows.reduce((sum, row) => sum + (getInstallValue(deptId, row.num).amount || 0), 0);
  };

  const getGrandTotal = (deptId: string) => {
    return getColumnTotal(deptId) + getTuitionTotal(deptId);
  };

  return (
    <AppShell activeTab="finance">
      <div className="flex flex-col gap-8 pb-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] glass-panel flex items-center justify-center border border-white/20 p-1.5 shadow-none">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white">
                <DollarSign className="size-8" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1.5">Financial Architecture</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Fee <span className="text-secondary">Management</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => generateBills.mutate()} 
              disabled={generateBills.isPending} 
              className="h-14 px-8 rounded-2xl bg-white text-slate-900 text-xs font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all shadow-xl"
            >
              <Zap className="h-4 w-4 mr-2 text-indigo-600" /> {generateBills.isPending ? "Generating..." : "Generate Bulk Invoices"}
            </Button>
            
            <div className="flex items-center gap-4 glass-panel px-6 py-3 rounded-[1.5rem] shadow-none">
               <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
               {years && years.length > 0 && (
                <select
                  className="bg-transparent border-none text-white font-black text-[11px] uppercase tracking-widest outline-none focus:ring-0 cursor-pointer pr-8"
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                >
                  {years.map(y => (
                    <option key={y.id} value={y.id} className="bg-slate-900 text-white font-black">{y.year_name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="requirements" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl mb-8">
            <TabsTrigger value="requirements" className="px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-[10px] font-black uppercase tracking-widest">
              <ClipboardList className="h-3.5 w-3.5 mr-2" /> Standards
            </TabsTrigger>
            <TabsTrigger value="installments" className="px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-[10px] font-black uppercase tracking-widest">
              <Calendar className="h-3.5 w-3.5 mr-2" /> Installments
            </TabsTrigger>
            <TabsTrigger value="categories" className="px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-[10px] font-black uppercase tracking-widest">
              <DollarSign className="h-3.5 w-3.5 mr-2" /> Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requirements" className="space-y-6">
            <div className="glass-card overflow-hidden border border-white/10">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Institutional Fee Matrix</h3>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Requirements & Registration Standards</p>
                </div>
                {Object.keys(rateEdits).length > 0 && (
                  <Button onClick={handleSaveRates} disabled={upsertRate.isPending} className="bg-secondary hover:bg-secondary/90 text-white h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    <Save className="h-4 w-4 mr-2" /> Save Standard Rates
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/5 bg-transparent hover:bg-transparent">
                      <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 px-8 min-w-[200px]">Service / Requirement</TableHead>
                      {departments?.map(dept => (
                        <TableHead key={dept.id} className="text-center text-[10px] font-black text-white/40 uppercase tracking-widest py-6 min-w-[140px]">{dept.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catLoading ? (
                      <TableRow><TableCell colSpan={(departments?.length || 0) + 1} className="text-center py-20 text-white/20 font-black uppercase tracking-widest text-[10px]">Processing Matrix...</TableCell></TableRow>
                    ) : categories?.map(cat => (
                      <TableRow key={cat.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="py-5 px-8 font-black text-white text-sm">{cat.name}</TableCell>
                        {departments?.map(dept => (
                          <TableCell key={dept.id} className="text-center p-3">
                            <Input
                              type="number"
                              className="text-center h-10 w-full bg-white/5 border-white/10 rounded-lg text-white font-bold focus:ring-indigo-500/50"
                              value={getRateValue(cat.id, dept.id) || ""}
                              onChange={e => setRateValue(cat.id, dept.id, parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow className="bg-white/[0.02] font-black border-t border-white/10">
                      <TableCell className="py-8 px-8 text-[11px] font-black text-secondary uppercase tracking-[0.2em]">Matrix Total</TableCell>
                      {departments?.map(dept => (
                        <TableCell key={dept.id} className="text-center py-8 font-black text-xl text-white tracking-tighter">
                          {getColumnTotal(dept.id).toLocaleString()} <span className="text-[10px] text-white/30 tracking-normal">LD</span>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="installments" className="space-y-6">
            <div className="glass-card overflow-hidden border border-white/10">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Tuition Distribution Strategy</h3>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Payment Period Configuration</p>
                </div>
                {Object.keys(installEdits).length > 0 && (
                  <Button onClick={handleSaveInstallments} disabled={upsertInstallment.isPending} className="bg-indigo-500 hover:bg-indigo-600 text-white h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    <Save className="h-4 w-4 mr-2" /> Save Installment Plan
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/5 bg-transparent hover:bg-transparent">
                      <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 px-8 min-w-[220px]">Payment Horizon</TableHead>
                      {departments?.map(dept => (
                        <TableHead key={dept.id} className="text-center text-[10px] font-black text-white/40 uppercase tracking-widest py-6 min-w-[140px]">{dept.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-white/[0.01]">
                      <TableCell className="py-6 px-8">
                        <div className="text-[11px] font-black text-white uppercase tracking-widest mb-2">Registration Threshold</div>
                        <Input
                          className="h-9 text-xs bg-white/5 border-white/5 text-white/50 italic rounded-lg"
                          value={regPeriod}
                          onChange={e => setRegPeriod(e.target.value)}
                          placeholder="e.g. July - September"
                        />
                      </TableCell>
                      {departments?.map(dept => (
                        <TableCell key={dept.id} className="text-center font-black text-white/40">
                          {getColumnTotal(dept.id).toLocaleString()} LD
                        </TableCell>
                      ))}
                    </TableRow>

                    {installmentRows.map(row => (
                      <TableRow key={row.num} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <TableCell className="py-6 px-8">
                          <Input
                            className="h-9 text-sm font-black text-white mb-2 bg-white/5 border-white/10 rounded-lg"
                            value={row.label}
                            onChange={e => updateInstallmentRowMeta(row.num, "label", e.target.value)}
                            placeholder="e.g. 1st Installment"
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              className="h-8 text-[10px] text-white/40 font-bold bg-transparent border-white/5 rounded-lg uppercase tracking-widest"
                              value={row.period_label}
                              onChange={e => updateInstallmentRowMeta(row.num, "period_label", e.target.value)}
                              placeholder="e.g. October - December"
                            />
                            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeInstallmentRow(row.num)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        {departments?.map(dept => (
                          <TableCell key={dept.id} className="text-center p-3">
                            <Input
                              type="number"
                              className="text-center h-10 w-full bg-white/5 border-white/10 rounded-lg text-white font-bold focus:ring-indigo-500/50"
                              value={getInstallValue(dept.id, row.num).amount || ""}
                              onChange={e => setInstallValue(dept.id, row.num, "amount", parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}

                    <TableRow>
                      <TableCell colSpan={(departments?.length || 0) + 1} className="py-6 text-center">
                        <Button variant="ghost" onClick={addInstallmentRow} className="h-12 px-6 rounded-xl border-dashed border border-white/10 text-white/40 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest">
                          <Plus className="h-4 w-4 mr-2" /> Append Installment Window
                        </Button>
                      </TableCell>
                    </TableRow>

                    <TableRow className="bg-white/[0.02] border-t border-white/10">
                      <TableCell className="py-6 px-8 text-[11px] font-black text-secondary uppercase tracking-[0.2em]">Tuition Total</TableCell>
                      {departments?.map(dept => (
                        <TableCell key={dept.id} className="text-center py-6 font-black text-white/60">
                          {getTuitionTotal(dept.id).toLocaleString()} LD
                        </TableCell>
                      ))}
                    </TableRow>

                    <TableRow className="bg-indigo-500/10 border-t-2 border-indigo-500/30">
                      <TableCell className="py-10 px-8 text-sm font-black text-secondary uppercase tracking-[0.3em]">Institutional Grand Total</TableCell>
                      {departments?.map(dept => (
                        <TableCell key={dept.id} className="text-center py-10 font-black text-3xl text-white tracking-tighter">
                          {getGrandTotal(dept.id).toLocaleString()} <span className="text-xs tracking-normal text-white/40">LD</span>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-end mb-4">
              <Dialog open={catOpen} onOpenChange={setCatOpen}>
                <DialogTrigger asChild>
                  <Button className="h-12 px-6 rounded-xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-white/90">
                    <Plus className="h-4 w-4 mr-2" /> Define Fee Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/90 backdrop-blur-2xl border-white/10 text-white rounded-[2rem] p-8 max-w-md">
                  <DialogHeader><DialogTitle className="text-2xl font-black tracking-tighter">New Category</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Category Label</Label>
                      <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Lab Fees" className="bg-white/5 border-white/10 h-12 rounded-xl" />
                    </div>
                    <Button
                      onClick={() => {
                        createCategory.mutate({ name: newCatName, display_order: (categories?.length || 0) + 1 }, {
                          onSuccess: () => { setCatOpen(false); setNewCatName(""); }
                        });
                      }}
                      disabled={!newCatName}
                      className="w-full h-14 rounded-2xl bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all mt-4"
                    >
                      Initialize Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="glass-card overflow-hidden border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/5 bg-transparent hover:bg-transparent">
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 px-8">Category Name</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Sequence</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Functional Type</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-right px-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map(cat => (
                    <TableRow key={cat.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="py-5 px-8 font-black text-white">{cat.name}</TableCell>
                      <TableCell className="py-5 font-mono text-xs text-white/40">{cat.display_order}</TableCell>
                      <TableCell className="py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cat.is_registration ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-white/5 text-white/40 border-white/5"}`}>
                          {cat.is_registration ? "Registration Component" : "Standard Variable"}
                        </span>
                      </TableCell>
                      <TableCell className="py-5 text-right px-8">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/5 hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-all group/btn" onClick={() => deleteCategory.mutate(cat.id)}>
                          <Trash2 className="h-4 w-4 text-white/40 group-hover/btn:text-rose-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default FeeManagement;
