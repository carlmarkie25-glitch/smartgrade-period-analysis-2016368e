import { useState, useRef } from "react";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Receipt, Eye, Printer, Search, DollarSign, Users } from "lucide-react";
import { useStudentBills, useStudentBillItems, useStudentPayments, useAllStudentPayments, useRecordStudentPayment } from "@/hooks/useStudentBilling";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const Payments = () => {
  const { data: years } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data } = await supabase.from("academic_years").select("*").order("start_date", { ascending: false });
      return data || [];
    },
  });

  const [selectedYear, setSelectedYear] = useState("");
  useEffect(() => {
    if (!selectedYear && years?.length) {
      const currentYear = years.find(y => y.is_current);
      setSelectedYear(currentYear ? currentYear.id : years[0].id);
    }
  }, [years, selectedYear]);

  const { data: bills, isLoading } = useStudentBills(selectedYear);
  const { data: allPayments } = useAllStudentPayments(selectedYear);
  const recordPayment = useRecordStudentPayment();

  const [search, setSearch] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [viewBill, setViewBill] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Payment form
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const filteredBills = bills?.filter(b => {
    const s = (b as any).students;
    if (!s) return false;
    const term = search.toLowerCase();
    return s.full_name?.toLowerCase().includes(term) || s.student_id?.toLowerCase().includes(term);
  }) || [];

  const handlePay = () => {
    if (!selectedBill) return;
    recordPayment.mutate({
      bill_id: selectedBill.id,
      student_id: selectedBill.student_id,
      amount: parseFloat(amount),
      payment_method: method,
      payment_date: date,
      notes: notes || undefined,
    }, {
      onSuccess: (data) => {
        setReceiptData({
          ...data,
          studentName: (selectedBill as any).students?.full_name,
          studentId: (selectedBill as any).students?.student_id,
          className: (selectedBill as any).students?.classes?.name,
          departmentName: (selectedBill as any).students?.departments?.name,
          grandTotal: selectedBill.grand_total,
          previousPaid: selectedBill.amount_paid,
          newBalance: selectedBill.balance - parseFloat(amount),
        });
        setPayOpen(false);
        setSelectedBill(null);
        setAmount("");
        setNotes("");
      },
    });
  };

  const statusColor = (s: string) => {
    if (s === "paid") return "bg-emerald-500/10 text-emerald-500";
    if (s === "partial") return "bg-amber-500/10 text-amber-500";
    return "bg-rose-500/10 text-rose-500";
  };

  const totalCollected = allPayments?.reduce((s, p) => s + p.amount, 0) || 0;
  const totalOutstanding = filteredBills.reduce((s, b) => s + b.balance, 0);

  return (
    <AppShell activeTab="finance">
      <div className="flex flex-col gap-8 pb-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] glass-panel flex items-center justify-center border border-white/20 p-1.5 shadow-none">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">
                <Receipt className="size-8" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1.5">Treasury Operations</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Payments <span className="text-secondary">& Billing</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 glass-panel px-6 py-3 rounded-[1.5rem] shadow-none self-start lg:self-center">
             <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-40" />
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Invoices", value: bills?.length || 0, icon: Users, color: "text-primary", bg: "bg-primary/10" },
            { label: "Total Collected", value: `${totalCollected.toLocaleString()} LD`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Outstanding", value: `${totalOutstanding.toLocaleString()} LD`, icon: DollarSign, color: "text-rose-500", bg: "bg-rose-500/10" },
          ].map((stat, i) => (
            <div key={i} className="p-8 glass-panel flex flex-col justify-between min-h-[160px] transition-all hover:bg-white/10 shadow-none group">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`size-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-4xl font-black text-white tracking-tighter leading-none">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="bills" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl mb-8">
            <TabsTrigger value="bills" className="px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-[10px] font-black uppercase tracking-widest">Student Bills</TabsTrigger>
            <TabsTrigger value="history" className="px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-[10px] font-black uppercase tracking-widest">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="bills" className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input 
                  placeholder="Search student name or ID..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="pl-11 bg-white/5 border-white/10 text-white rounded-2xl h-12 focus:ring-primary/50 text-sm font-medium" 
                />
              </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 px-6">Student ID</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Name</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Class</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-right">Total</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-right">Paid</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-right">Balance</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Status</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-20 text-white/30 font-black uppercase tracking-widest text-[10px]">Processing Data...</TableCell></TableRow>
                  ) : filteredBills.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-20 text-white/30 font-black uppercase tracking-widest text-[10px]">No Records Found</TableCell></TableRow>
                  ) : filteredBills.map(bill => {
                    const s = (bill as any).students;
                    return (
                      <TableRow key={bill.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <TableCell className="py-5 px-6 font-mono text-xs text-white/60">{s?.student_id}</TableCell>
                        <TableCell className="py-5 font-black text-white">{s?.full_name}</TableCell>
                        <TableCell className="py-5 text-sm font-bold text-white/60">{s?.classes?.name || "—"}</TableCell>
                        <TableCell className="py-5 text-right font-black text-white">{bill.grand_total.toLocaleString()} LD</TableCell>
                        <TableCell className="py-5 text-right font-black text-emerald-400">{bill.amount_paid.toLocaleString()} LD</TableCell>
                        <TableCell className="py-5 text-right font-black text-rose-400">{bill.balance.toLocaleString()} LD</TableCell>
                        <TableCell className="py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColor(bill.status)}`}>
                            {bill.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-5 text-right px-6">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10" onClick={() => setViewBill(bill)}>
                              <Eye className="h-4 w-4 text-white" />
                            </Button>
                            {bill.status !== "paid" && (
                              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-primary/20 hover:bg-primary/30" onClick={() => { setSelectedBill(bill); setPayOpen(true); }}>
                                <Plus className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="glass-card overflow-hidden border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 px-6">Date</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Receipt #</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Student</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-right">Amount</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Method</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Notes</TableHead>
                    <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!allPayments?.length ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-20 text-white/30 font-black uppercase tracking-widest text-[10px]">No Transactions Recorded</TableCell></TableRow>
                  ) : allPayments.map(p => (
                    <TableRow key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="py-5 px-6 text-sm font-bold text-white/60">{p.payment_date}</TableCell>
                      <TableCell className="py-5 font-mono text-xs text-white/80">{p.receipt_number}</TableCell>
                      <TableCell className="py-5 font-black text-white">{(p as any).students?.full_name}</TableCell>
                      <TableCell className="py-5 text-right font-black text-emerald-400">{p.amount.toLocaleString()} LD</TableCell>
                      <TableCell className="py-5">
                        <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-[9px] font-black uppercase tracking-widest">
                          {p.payment_method}
                        </span>
                      </TableCell>
                      <TableCell className="py-5 text-xs text-white/40 italic">{p.notes || "—"}</TableCell>
                      <TableCell className="py-5 text-right px-6">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                          const bill = (p as any).bill;
                          const billStudent = bill?.students;
                          setReceiptData({
                            receipt_number: p.receipt_number,
                            payment_date: p.payment_date,
                            amount: p.amount,
                            payment_method: p.payment_method,
                            studentName: billStudent?.full_name || (p as any).students?.full_name,
                            studentId: billStudent?.student_id || (p as any).students?.student_id,
                            className: billStudent?.classes?.name || "—",
                            departmentName: billStudent?.departments?.name || "—",
                            grandTotal: bill?.grand_total,
                            previousPaid: (bill?.amount_paid || 0) - p.amount,
                            newBalance: bill?.balance,
                          });
                        }}>
                          <Receipt className="h-4 w-4 text-white" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Record Payment Dialog */}
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent className="bg-slate-900/90 backdrop-blur-2xl border-white/10 text-white rounded-[2rem] p-8 max-w-md">
            <DialogHeader><DialogTitle className="text-2xl font-black tracking-tighter">Record Payment</DialogTitle></DialogHeader>
            {selectedBill && (
              <div className="space-y-6 pt-4">
                <div className="glass-panel p-5 space-y-2 !rounded-2xl border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Student</span>
                    <span className="text-sm font-black text-white">{(selectedBill as any).students?.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Balance Due</span>
                    <span className="text-xl font-black text-rose-400">{selectedBill.balance.toLocaleString()} LD</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Payment Amount</Label>
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="bg-white/5 border-white/10 h-12 rounded-xl font-black text-lg" placeholder="0.00" max={selectedBill.balance} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Payment Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Date</Label>
                      <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Notes</Label>
                      <Input value={notes} onChange={e => setNotes(e.target.value)} className="bg-white/5 border-white/10 h-12 rounded-xl text-xs" placeholder="Optional" />
                    </div>
                  </div>
                </div>

                <Button onClick={handlePay} disabled={!amount || parseFloat(amount) <= 0} className="w-full h-14 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all mt-4">
                  Complete Transaction
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Bill Dialog */}
        <BillDetailDialog bill={viewBill} onClose={() => setViewBill(null)} />

        {/* Receipt Dialog */}
        <ReceiptDialog data={receiptData} onClose={() => setReceiptData(null)} />
      </div>
    </AppShell>
  );
};

// Bill Detail component
const BillDetailDialog = ({ bill, onClose }: { bill: any; onClose: () => void }) => {
  const { data: items } = useStudentBillItems(bill?.id);
  const { data: payments } = useStudentPayments(bill?.id);
  if (!bill) return null;
  const s = bill.students;

  return (
    <Dialog open={!!bill} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl bg-slate-900/90 backdrop-blur-2xl border-white/10 text-white rounded-[2.5rem] p-10 max-h-[85vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black tracking-tighter">Bill Summary</DialogTitle>
        </DialogHeader>
        <div className="space-y-8 mt-6">
          <div className="glass-panel p-6 grid grid-cols-2 gap-6 !rounded-[2rem]">
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Student Particulars</p>
              <p className="text-lg font-black text-white leading-tight">{s?.full_name}</p>
              <p className="text-xs font-bold text-white/50">{s?.student_id}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Academic Info</p>
              <p className="text-lg font-black text-white leading-tight">{s?.classes?.name}</p>
              <p className="text-xs font-bold text-white/50">{s?.departments?.name}</p>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Registration & Administrative Fees</h4>
              <div className="glass-panel !rounded-[1.5rem] p-4 space-y-2">
                {items?.filter(i => i.item_type === "registration").map(i => (
                  <div key={i.id} className="flex justify-between items-center py-1">
                    <span className="text-sm font-bold text-white/70">{i.item_name}</span>
                    <span className="text-sm font-black text-white">{i.amount.toLocaleString()} LD</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-white/5">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Section Total</span>
                  <span className="text-lg font-black text-primary">{bill.registration_total.toLocaleString()} LD</span>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4">Tuition Distribution</h4>
              <div className="glass-panel !rounded-[1.5rem] p-4 space-y-2">
                {items?.filter(i => i.item_type === "installment").map(i => (
                  <div key={i.id} className="flex justify-between items-center py-1">
                    <span className="text-sm font-bold text-white/70">{i.item_name}</span>
                    <span className="text-sm font-black text-white">{i.amount.toLocaleString()} LD</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-white/5">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Section Total</span>
                  <span className="text-lg font-black text-secondary">{bill.tuition_total.toLocaleString()} LD</span>
                </div>
              </div>
            </section>
          </div>

          <div className="bg-primary p-8 rounded-[2rem] text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <h5 className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Final Financial Standing</h5>
              <div className="text-4xl font-black tracking-tighter">
                {bill.balance.toLocaleString()} <span className="text-xl opacity-40">LD BALANCE</span>
              </div>
            </div>
            <div className="relative z-10 text-right">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Grand Total</p>
              <p className="text-2xl font-black">{bill.grand_total.toLocaleString()} LD</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Receipt Dialog with print
const ReceiptDialog = ({ data, onClose }: { data: any; onClose: () => void }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  if (!data) return null;

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt ${data.receipt_number}</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; color: #000; }
        .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        .header h2 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .row.bold { font-weight: 900; }
        .row.large { font-size: 20px; border-bottom: 2px solid #000; margin-top: 10px; padding: 15px 0; }
        .divider { border-top: 2px dashed #000; margin: 20px 0; }
        .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
      </style></head><body>
      ${content.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <Dialog open={!!data} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md bg-white text-black rounded-[2rem] p-10 shadow-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tighter"><Receipt className="h-6 w-6 text-primary" /> Official Receipt</DialogTitle></DialogHeader>
        <div ref={receiptRef} className="mt-6">
          <div className="header" style={{ textAlign: "center", borderBottom: "3px solid #000", paddingBottom: 20, marginBottom: 30 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, textTransform: "uppercase" }}>SmartGrade Academy</h2>
            <p style={{ margin: "5px 0", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#666" }}>Institutional Treasury Department</p>
          </div>
          <div style={{ fontSize: 13 }}>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ fontWeight: 800, color: "#666" }}>RECEIPT ID</span><span style={{ fontWeight: 900 }}>{data.receipt_number}</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ fontWeight: 800, color: "#666" }}>TRANSACTION DATE</span><span style={{ fontWeight: 900 }}>{data.payment_date}</span>
            </div>
            
            <div style={{ marginTop: 25, marginBottom: 10 }}>
              <p style={{ fontSize: 9, fontWeight: 900, color: "primary", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>Student Credentials</p>
              <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ color: "#666" }}>NAME</span><span style={{ fontWeight: 900 }}>{data.studentName}</span>
              </div>
              <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ color: "#666" }}>STUDENT ID</span><span style={{ fontWeight: 900 }}>{data.studentId}</span>
              </div>
              <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ color: "#666" }}>CLASS</span><span style={{ fontWeight: 900 }}>{data.className}</span>
              </div>
            </div>

            <div style={{ borderTop: "2px dashed #000", margin: "25px 0" }} />
            
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <span style={{ color: "#666" }}>INVOICE TOTAL</span><span style={{ fontWeight: 900 }}>{data.grandTotal?.toLocaleString()} LD</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <span style={{ color: "#666" }}>CUMULATIVE PAID</span><span style={{ fontWeight: 900 }}>{data.previousPaid?.toLocaleString()} LD</span>
            </div>
            <div className="row large" style={{ display: "flex", justifyContent: "space-between", padding: "15px 0", borderTop: "2px solid #000", borderBottom: "2px solid #000", marginTop: 10, fontSize: 20, fontWeight: 900 }}>
              <span>AMOUNT PAID</span><span style={{ color: "#000" }}>{data.amount?.toLocaleString()} LD</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "none" }}>
              <span style={{ color: "#666" }}>PAYMENT METHOD</span><span style={{ fontWeight: 900, textTransform: "uppercase" }}>{data.payment_method}</span>
            </div>
            
            <div style={{ background: "#f8f8f8", padding: 15, borderRadius: 12, marginTop: 20 }}>
              <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "0", border: "none" }}>
                <span style={{ fontWeight: 900, color: "#999", fontSize: 10 }}>REMAINING BALANCE</span>
                <span style={{ fontWeight: 900, color: "#ff0000", fontSize: 16 }}>{data.newBalance?.toLocaleString()} LD</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 40, fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "1px" }}>
            <p>This is a computer generated document</p>
            <p>Authorized by SmartGrade School Treasury</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="w-full h-14 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all mt-8">
          <Printer className="h-4 w-4 mr-2" /> Generate Print Copy
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default Payments;
