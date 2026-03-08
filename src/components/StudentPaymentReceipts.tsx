import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Receipt, Printer } from "lucide-react";
import { useMyStudentPayments } from "@/hooks/useStudentBilling";

const StudentPaymentReceipts = () => {
  const { data: payments, isLoading } = useMyStudentPayments();
  const [receiptData, setReceiptData] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt ${receiptData.receipt_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .header h2 { margin: 0; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; }
        .divider { border-top: 1px dashed #999; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style></head><body>
      ${content.innerHTML}
      <script>window.print(); window.close();<\/script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Receipt #</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : !payments?.length ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payment records found</TableCell></TableRow>
              ) : payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.payment_date}</TableCell>
                  <TableCell className="font-mono text-sm">{p.receipt_number}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">{p.amount?.toLocaleString()}LD</TableCell>
                  <TableCell><Badge variant="outline">{p.payment_method}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{p.notes || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" title="View Receipt" onClick={() => {
                      setReceiptData({
                        receipt_number: p.receipt_number,
                        payment_date: p.payment_date,
                        amount: p.amount,
                        payment_method: p.payment_method,
                        studentName: p.student?.full_name,
                        studentId: p.student?.student_id,
                        className: p.student?.classes?.name || "—",
                        departmentName: p.student?.departments?.name || "—",
                        grandTotal: p.bill?.grand_total,
                        previousPaid: (p.bill?.amount_paid || 0) - p.amount,
                        newBalance: p.bill?.balance,
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

      {/* Receipt Dialog */}
      <Dialog open={!!receiptData} onOpenChange={() => setReceiptData(null)}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Payment Receipt</DialogTitle></DialogHeader>
          {receiptData && (
            <>
              <div ref={receiptRef}>
                <div style={{ textAlign: "center", borderBottom: "2px solid", paddingBottom: 10, marginBottom: 15 }}>
                  <h2 style={{ margin: 0 }}>SmartGrade School</h2>
                  <p style={{ margin: "4px 0", fontSize: 12 }}>Payment Receipt</p>
                </div>
                <div style={{ fontSize: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Receipt No:</span><span style={{ fontWeight: "bold" }}>{receiptData.receipt_number}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Date:</span><span>{receiptData.payment_date}</span>
                  </div>
                  <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Student:</span><span>{receiptData.studentName}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Student ID:</span><span>{receiptData.studentId}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Class:</span><span>{receiptData.className}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Division:</span><span>{receiptData.departmentName}</span>
                  </div>
                  <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Total Bill:</span><span>{receiptData.grandTotal?.toLocaleString()}LD</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Previously Paid:</span><span>{receiptData.previousPaid?.toLocaleString()}LD</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: "bold", fontSize: 16 }}>
                    <span>Amount Paid:</span><span style={{ color: "green" }}>{receiptData.amount?.toLocaleString()}LD</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Method:</span><span>{receiptData.payment_method}</span>
                  </div>
                  <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: "bold" }}>
                    <span>New Balance:</span><span style={{ color: "red" }}>{receiptData.newBalance?.toLocaleString()}LD</span>
                  </div>
                </div>
                <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#666" }}>
                  <p>Thank you for your payment!</p>
                </div>
              </div>
              <Button onClick={handlePrint} className="w-full mt-2">
                <Printer className="h-4 w-4 mr-2" /> Print Receipt
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentPaymentReceipts;
