import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt } from "lucide-react";
import { usePayments, useRecordPayment, useFeeAssignments } from "@/hooks/useFinance";

const Payments = () => {
  const { data: payments, isLoading } = usePayments();
  const { data: assignments } = useFeeAssignments();
  const recordPayment = useRecordPayment();

  const [open, setOpen] = useState(false);
  const [assignId, setAssignId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [receipt, setReceipt] = useState("");
  const [notes, setNotes] = useState("");

  const pendingAssignments = assignments?.filter(a => a.status !== "paid") || [];
  const selectedAssignment = assignments?.find(a => a.id === assignId);

  const handleRecord = () => {
    if (!selectedAssignment) return;
    recordPayment.mutate({
      fee_assignment_id: assignId,
      student_id: selectedAssignment.student_id,
      amount: parseFloat(amount),
      payment_method: method,
      payment_date: date,
      receipt_number: receipt || undefined,
      notes: notes || undefined,
    }, { onSuccess: () => { setOpen(false); setAssignId(""); setAmount(""); setReceipt(""); setNotes(""); } });
  };

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground">Record and track fee payments</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Fee Assignment</Label>
                  <Select value={assignId} onValueChange={setAssignId}>
                    <SelectTrigger><SelectValue placeholder="Select student fee" /></SelectTrigger>
                    <SelectContent>
                      {pendingAssignments.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {(a as any).students?.full_name} — {(a as any).fee_structures?.name} (Bal: {(a.amount_due - a.amount_paid).toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Amount</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></div>
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
                <div><Label>Receipt Number</Label><Input value={receipt} onChange={e => setReceipt(e.target.value)} placeholder="Optional" /></div>
                <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" /></div>
                <Button onClick={handleRecord} disabled={!assignId || !amount} className="w-full">Record Payment</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Receipt #</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : payments?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments recorded yet</TableCell></TableRow>
                ) : payments?.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell className="font-medium">{(p as any).students?.full_name}</TableCell>
                    <TableCell>{(p as any).fee_assignments?.fee_structures?.name || "—"}</TableCell>
                    <TableCell className="font-medium">{p.amount.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{p.payment_method}</Badge></TableCell>
                    <TableCell>{p.receipt_number || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default Payments;
