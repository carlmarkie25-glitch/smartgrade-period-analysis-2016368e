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
    if (s === "paid") return "default";
    if (s === "partial") return "secondary";
    return "destructive";
  };

  const totalCollected = allPayments?.reduce((s, p) => s + p.amount, 0) || 0;
  const totalOutstanding = filteredBills.reduce((s, b) => s + b.balance, 0);

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payments & Billing</h1>
            <p className="text-muted-foreground">Track student bills and record payments</p>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Academic Year" /></SelectTrigger>
            <SelectContent>
              {years?.map(y => (
                <SelectItem key={y.id} value={y.id}>{y.year_name} {y.is_current ? "(Current)" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bills</p>
                  <p className="text-2xl font-bold">{bills?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10"><DollarSign className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-bold text-green-600">{totalCollected.toLocaleString()}LD</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10"><DollarSign className="h-5 w-5 text-destructive" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-destructive">{totalOutstanding.toLocaleString()}LD</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bills">
          <TabsList>
            <TabsTrigger value="bills">Student Bills</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          {/* Student Bills */}
          <TabsContent value="bills" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search student name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : filteredBills.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No bills found. Generate bills from Fee Management.</TableCell></TableRow>
                    ) : filteredBills.map(bill => {
                      const s = (bill as any).students;
                      return (
                        <TableRow key={bill.id}>
                          <TableCell className="font-mono text-sm">{s?.student_id}</TableCell>
                          <TableCell className="font-medium">{s?.full_name}</TableCell>
                          <TableCell>{s?.classes?.name || "—"}</TableCell>
                          <TableCell className="text-right font-medium">{bill.grand_total.toLocaleString()}LD</TableCell>
                          <TableCell className="text-right text-green-600">{bill.amount_paid.toLocaleString()}LD</TableCell>
                          <TableCell className="text-right text-destructive font-bold">{bill.balance.toLocaleString()}LD</TableCell>
                          <TableCell><Badge variant={statusColor(bill.status)}>{bill.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" title="View Bill" onClick={() => setViewBill(bill)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {bill.status !== "paid" && (
                                <Button variant="ghost" size="icon" title="Record Payment" onClick={() => { setSelectedBill(bill); setPayOpen(true); }}>
                                  <Plus className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {!allPayments?.length ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments recorded yet</TableCell></TableRow>
                    ) : allPayments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{p.payment_date}</TableCell>
                        <TableCell className="font-mono text-sm">{p.receipt_number}</TableCell>
                        <TableCell className="font-medium">{(p as any).students?.full_name}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">{p.amount.toLocaleString()}LD</TableCell>
                        <TableCell><Badge variant="outline">{p.payment_method}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{p.notes || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" title="View Receipt" onClick={() => {
                            const bill = (p as any).bill;
                            const billStudent = bill?.students;
                            // Calculate previousPaid: total paid at the time = bill.amount_paid - all later payments
                            // Simpler: we know total paid on bill, and this payment's amount
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
                            <Receipt className="h-4 w-4" />
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

        {/* Record Payment Dialog */}
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            {selectedBill && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                  <p><span className="font-medium">Student:</span> {(selectedBill as any).students?.full_name}</p>
                  <p><span className="font-medium">Total Bill:</span> {selectedBill.grand_total.toLocaleString()}LD</p>
                  <p><span className="font-medium">Already Paid:</span> {selectedBill.amount_paid.toLocaleString()}LD</p>
                  <p className="text-destructive font-bold">Balance: {selectedBill.balance.toLocaleString()}LD</p>
                </div>
                <div><Label>Amount</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" max={selectedBill.balance} /></div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" /></div>
                <Button onClick={handlePay} disabled={!amount || parseFloat(amount) <= 0} className="w-full">Record Payment</Button>
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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Bill Details</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
            <p><span className="font-medium">Student:</span> {s?.full_name} ({s?.student_id})</p>
            <p><span className="font-medium">Class:</span> {s?.classes?.name}</p>
            <p><span className="font-medium">Division:</span> {s?.departments?.name}</p>
          </div>

          {/* Registration items */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Registration & Requirements</h4>
            <div className="space-y-1">
              {items?.filter(i => i.item_type === "registration").map(i => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span>{i.item_name}</span>
                  <span className="font-medium">{i.amount.toLocaleString()}LD</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold border-t pt-1">
                <span>Subtotal</span>
                <span>{bill.registration_total.toLocaleString()}LD</span>
              </div>
            </div>
          </div>

          {/* Installment items */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Tuition Installments</h4>
            <div className="space-y-1">
              {items?.filter(i => i.item_type === "installment").map(i => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span>{i.item_name}</span>
                  <span className="font-medium">{i.amount.toLocaleString()}LD</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold border-t pt-1">
                <span>Subtotal</span>
                <span>{bill.tuition_total.toLocaleString()}LD</span>
              </div>
            </div>
          </div>

          <div className="bg-destructive/10 rounded-lg p-3 space-y-1">
            <div className="flex justify-between font-bold"><span>Grand Total</span><span>{bill.grand_total.toLocaleString()}LD</span></div>
            <div className="flex justify-between text-green-600"><span>Total Paid</span><span>{bill.amount_paid.toLocaleString()}LD</span></div>
            <div className="flex justify-between font-bold text-destructive"><span>Balance</span><span>{bill.balance.toLocaleString()}LD</span></div>
          </div>

          {/* Payment history */}
          {payments && payments.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Payment History</h4>
              <div className="space-y-1">
                {payments.map(p => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span>{p.payment_date} — {p.receipt_number}</span>
                    <span className="text-green-600 font-medium">{p.amount.toLocaleString()}LD</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .header h2 { margin: 0; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; }
        .row.bold { font-weight: bold; }
        .divider { border-top: 1px dashed #999; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style></head><body>
      ${content.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <Dialog open={!!data} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Payment Receipt</DialogTitle></DialogHeader>
        <div ref={receiptRef}>
          <div className="header" style={{ textAlign: "center", borderBottom: "2px solid", paddingBottom: 10, marginBottom: 15 }}>
            <h2 style={{ margin: 0 }}>SmartGrade School</h2>
            <p style={{ margin: "4px 0", fontSize: 12 }}>Payment Receipt</p>
          </div>
          <div style={{ fontSize: 14 }}>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Receipt No:</span><span style={{ fontWeight: "bold" }}>{data.receipt_number}</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Date:</span><span>{data.payment_date}</span>
            </div>
            <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Student:</span><span>{data.studentName}</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Student ID:</span><span>{data.studentId}</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Class:</span><span>{data.className}</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Division:</span><span>{data.departmentName}</span>
            </div>
            <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Total Bill:</span><span>{data.grandTotal?.toLocaleString()}LD</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Previously Paid:</span><span>{data.previousPaid?.toLocaleString()}LD</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: "bold", fontSize: 16 }}>
              <span>Amount Paid:</span><span style={{ color: "green" }}>{data.amount?.toLocaleString()}LD</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>Method:</span><span>{data.payment_method}</span>
            </div>
            <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />
            <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: "bold" }}>
              <span>New Balance:</span><span style={{ color: "red" }}>{data.newBalance?.toLocaleString()}LD</span>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#666" }}>
            <p>Thank you for your payment!</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="w-full mt-2">
          <Printer className="h-4 w-4 mr-2" /> Print Receipt
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default Payments;
