import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Fee Structures
export const useFeeStructures = () => {
  return useQuery({
    queryKey: ["fee-structures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*, academic_years(year_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateFeeStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; description?: string; amount: number; academic_year_id?: string; is_active?: boolean }) => {
      const { error } = await supabase.from("fee_structures").insert(values);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-structures"] }); toast.success("Fee structure created"); },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteFeeStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_structures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-structures"] }); toast.success("Fee structure deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
};

// Fee Assignments
export const useFeeAssignments = () => {
  return useQuery({
    queryKey: ["fee-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_assignments")
        .select("*, fee_structures(name, amount), students(full_name, student_id, class_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateFeeAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { fee_structure_id: string; student_id: string; amount_due: number; due_date?: string }) => {
      const { error } = await supabase.from("fee_assignments").insert(values);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-assignments"] }); toast.success("Fee assigned"); },
    onError: (e: any) => toast.error(e.message),
  });
};

// Payments
export const usePayments = () => {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, students(full_name, student_id), fee_assignments(fee_structures(name))")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useRecordPayment = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { fee_assignment_id: string; student_id: string; amount: number; payment_method: string; payment_date: string; receipt_number?: string; notes?: string }) => {
      const { error: payError } = await supabase.from("payments").insert({ ...values, created_by: user?.id });
      if (payError) throw payError;

      // Update fee_assignment amount_paid & status
      const { data: fa } = await supabase.from("fee_assignments").select("amount_due, amount_paid").eq("id", values.fee_assignment_id).single();
      if (fa) {
        const newPaid = (fa.amount_paid || 0) + values.amount;
        const status = newPaid >= fa.amount_due ? "paid" : "partial";
        await supabase.from("fee_assignments").update({ amount_paid: newPaid, status }).eq("id", values.fee_assignment_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["fee-assignments"] });
      toast.success("Payment recorded");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

// Expenses
export const useExpenses = () => {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateExpense = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { category: string; description?: string; amount: number; expense_date: string; paid_to?: string; payment_method?: string }) => {
      const { error } = await supabase.from("expenses").insert({ ...values, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Expense recorded"); },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Expense deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
};
