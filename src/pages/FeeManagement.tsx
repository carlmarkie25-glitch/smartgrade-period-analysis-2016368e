import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, DollarSign, Users } from "lucide-react";
import { useFeeStructures, useCreateFeeStructure, useDeleteFeeStructure, useFeeAssignments, useCreateFeeAssignment } from "@/hooks/useFinance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FeeManagement = () => {
  const { data: fees, isLoading: feesLoading } = useFeeStructures();
  const { data: assignments, isLoading: assignLoading } = useFeeAssignments();
  const createFee = useCreateFeeStructure();
  const deleteFee = useDeleteFeeStructure();
  const createAssignment = useCreateFeeAssignment();

  const { data: years } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data } = await supabase.from("academic_years").select("*").order("start_date", { ascending: false });
      return data || [];
    },
  });

  const { data: students } = useQuery({
    queryKey: ["all-students"],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id, full_name, student_id, class_id");
      return data || [];
    },
  });

  const [feeOpen, setFeeOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [feeName, setFeeName] = useState("");
  const [feeDesc, setFeeDesc] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeYear, setFeeYear] = useState("");
  const [assignFee, setAssignFee] = useState("");
  const [assignStudent, setAssignStudent] = useState("");
  const [assignDue, setAssignDue] = useState("");

  const handleCreateFee = () => {
    createFee.mutate({
      name: feeName,
      description: feeDesc || undefined,
      amount: parseFloat(feeAmount),
      academic_year_id: feeYear || undefined,
    }, { onSuccess: () => { setFeeOpen(false); setFeeName(""); setFeeDesc(""); setFeeAmount(""); setFeeYear(""); } });
  };

  const handleAssignFee = () => {
    const fee = fees?.find(f => f.id === assignFee);
    createAssignment.mutate({
      fee_structure_id: assignFee,
      student_id: assignStudent,
      amount_due: fee?.amount || 0,
      due_date: assignDue || undefined,
    }, { onSuccess: () => { setAssignOpen(false); setAssignFee(""); setAssignStudent(""); setAssignDue(""); } });
  };

  const statusColor = (s: string) => {
    if (s === "paid") return "default";
    if (s === "partial") return "secondary";
    return "destructive";
  };

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fee Management</h1>
            <p className="text-muted-foreground">Manage fee structures and student fee assignments</p>
          </div>
        </div>

        <Tabs defaultValue="structures">
          <TabsList>
            <TabsTrigger value="structures"><DollarSign className="h-4 w-4 mr-1" /> Fee Structures</TabsTrigger>
            <TabsTrigger value="assignments"><Users className="h-4 w-4 mr-1" /> Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="structures" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={feeOpen} onOpenChange={setFeeOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> Add Fee Structure</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Fee Structure</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Name</Label><Input value={feeName} onChange={e => setFeeName(e.target.value)} placeholder="e.g. Tuition Fee" /></div>
                    <div><Label>Amount</Label><Input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} placeholder="0.00" /></div>
                    <div><Label>Description</Label><Input value={feeDesc} onChange={e => setFeeDesc(e.target.value)} /></div>
                    <div>
                      <Label>Academic Year</Label>
                      <Select value={feeYear} onValueChange={setFeeYear}>
                        <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                        <SelectContent>{years?.map(y => <SelectItem key={y.id} value={y.id}>{y.year_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateFee} disabled={!feeName || !feeAmount} className="w-full">Create</Button>
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
                      <TableHead>Amount</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feesLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : fees?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No fee structures yet</TableCell></TableRow>
                    ) : fees?.map(fee => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">{fee.name}</TableCell>
                        <TableCell>{fee.amount.toLocaleString()}</TableCell>
                        <TableCell>{(fee as any).academic_years?.year_name || "—"}</TableCell>
                        <TableCell><Badge variant={fee.is_active ? "default" : "secondary"}>{fee.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => deleteFee.mutate(fee.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> Assign Fee</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Assign Fee to Student</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Fee Structure</Label>
                      <Select value={assignFee} onValueChange={setAssignFee}>
                        <SelectTrigger><SelectValue placeholder="Select fee" /></SelectTrigger>
                        <SelectContent>{fees?.filter(f => f.is_active).map(f => <SelectItem key={f.id} value={f.id}>{f.name} — {f.amount.toLocaleString()}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Student</Label>
                      <Select value={assignStudent} onValueChange={setAssignStudent}>
                        <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                        <SelectContent>{students?.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.student_id})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Due Date</Label><Input type="date" value={assignDue} onChange={e => setAssignDue(e.target.value)} /></div>
                    <Button onClick={handleAssignFee} disabled={!assignFee || !assignStudent} className="w-full">Assign</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : assignments?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No fee assignments yet</TableCell></TableRow>
                    ) : assignments?.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{(a as any).students?.full_name}</TableCell>
                        <TableCell>{(a as any).fee_structures?.name}</TableCell>
                        <TableCell>{a.amount_due.toLocaleString()}</TableCell>
                        <TableCell>{a.amount_paid.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{(a.amount_due - a.amount_paid).toLocaleString()}</TableCell>
                        <TableCell><Badge variant={statusColor(a.status) as any}>{a.status}</Badge></TableCell>
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
