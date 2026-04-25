import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useExpenses, useCreateExpense, useDeleteExpense } from "@/hooks/useFinance";

import { TrendingDown, CreditCard, CalendarDays, User } from "lucide-react";

const EXPENSE_CATEGORIES = [
  "Utilities",
  "Supplies",
  "Maintenance",
  "Salaries",
  "Rent",
  "Insurance",
  "Academics",
  "Transportation",
  "Other"
];

const Expenses = () => {
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidTo, setPaidTo] = useState("");
  const [method, setMethod] = useState("cash");

  const handleCreate = () => {
    createExpense.mutate({
      category,
      description: description || undefined,
      amount: parseFloat(amount),
      expense_date: date,
      paid_to: paidTo || undefined,
      payment_method: method,
    }, { onSuccess: () => { setOpen(false); setCategory(""); setDescription(""); setAmount(""); setPaidTo(""); } });
  };

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  return (
    <AppShell activeTab="finance">
      <div className="flex flex-col gap-8 pb-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] glass-panel flex items-center justify-center border border-white/20 p-1.5 shadow-none">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white">
                <TrendingDown className="size-8" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1.5">Expenditure Tracking</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                School <span className="text-rose-500">Expenses</span>
              </h1>
            </div>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 px-8 rounded-2xl bg-white text-slate-900 text-xs font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all shadow-xl">
                <Plus className="h-4 w-4 mr-2" /> Log New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900/90 backdrop-blur-2xl border-white/10 text-white rounded-[2rem] p-8 max-w-md">
              <DialogHeader><DialogTitle className="text-2xl font-black tracking-tighter">New Expenditure</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl font-bold">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Amount</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="bg-white/5 border-white/10 h-12 rounded-xl font-black text-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} className="bg-white/5 border-white/10 h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Paid To</Label>
                  <Input value={paidTo} onChange={e => setPaidTo(e.target.value)} className="bg-white/5 border-white/10 h-12 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Date</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl font-bold text-xs">
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
                </div>
                <Button onClick={handleCreate} disabled={!category || !amount} className="w-full h-14 rounded-2xl bg-rose-500 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-rose-600 transition-all mt-4">
                  Save Expenditure
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Total Expense Hero Card */}
        <div className="p-10 glass-panel border-rose-500/20 bg-rose-500/5 flex items-center justify-between !rounded-[2.5rem] shadow-none group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-[0.4em] mb-3">Total Operational Expenditure</p>
            <div className="text-6xl font-black text-white tracking-tighter flex items-baseline gap-2">
              {totalExpenses.toLocaleString()} <span className="text-xl text-white/30 font-bold tracking-normal uppercase">LD Total</span>
            </div>
          </div>
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <TrendingDown className="size-10 text-rose-500" />
          </div>
        </div>

        {/* Expenses Table */}
        <div className="glass-card overflow-hidden border border-white/10">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 px-8"><CalendarDays className="size-3 inline mr-2" /> Date</TableHead>
                <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6"><CreditCard className="size-3 inline mr-2" /> Category</TableHead>
                <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Description</TableHead>
                <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6"><User className="size-3 inline mr-2" /> Paid To</TableHead>
                <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-right">Amount</TableHead>
                <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Method</TableHead>
                <TableHead className="text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-right px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 text-white/20 font-black uppercase tracking-widest text-[10px]">Processing Data...</TableCell></TableRow>
              ) : expenses?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 text-white/20 font-black uppercase tracking-widest text-[10px]">No Expenditures Logged</TableCell></TableRow>
              ) : expenses?.map(e => (
                <TableRow key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell className="py-5 px-8 text-sm font-bold text-white/60">{e.expense_date}</TableCell>
                  <TableCell className="py-5">
                    <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-widest border border-rose-500/20">
                      {e.category}
                    </span>
                  </TableCell>
                  <TableCell className="py-5 font-black text-white text-sm">{e.description || "—"}</TableCell>
                  <TableCell className="py-5 text-sm font-bold text-white/60">{e.paid_to || "—"}</TableCell>
                  <TableCell className="py-5 text-right font-black text-white text-base">{Number(e.amount).toLocaleString()} LD</TableCell>
                  <TableCell className="py-5">
                    <span className="px-3 py-1 rounded-full bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest border border-white/5">
                      {e.payment_method}
                    </span>
                  </TableCell>
                  <TableCell className="py-5 text-right px-8">
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/5 hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-all group/btn" onClick={() => deleteExpense.mutate(e.id)}>
                      <Trash2 className="h-4 w-4 text-white/40 group-hover/btn:text-rose-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
};

export default Expenses;
