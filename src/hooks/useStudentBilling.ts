import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useStudentBills = (academicYearId?: string) => {
  return useQuery({
    queryKey: ["student-bills", academicYearId],
    queryFn: async () => {
      let query = supabase
        .from("student_bills")
        .select("*, students(full_name, student_id, department_id, class_id, classes:class_id(name), departments:department_id(name))")
        .order("created_at", { ascending: false });
      if (academicYearId) query = query.eq("academic_year_id", academicYearId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!academicYearId,
  });
};

export const useStudentBillItems = (billId?: string) => {
  return useQuery({
    queryKey: ["student-bill-items", billId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_bill_items")
        .select("*")
        .eq("bill_id", billId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!billId,
  });
};

export const useStudentPayments = (billId?: string) => {
  return useQuery({
    queryKey: ["student-payments", billId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_payments")
        .select("*")
        .eq("bill_id", billId!)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!billId,
  });
};

export const useAllStudentPayments = (academicYearId?: string) => {
  return useQuery({
    queryKey: ["all-student-payments", academicYearId],
    queryFn: async () => {
      // Get bill IDs for the academic year first
      const { data: bills } = await supabase
        .from("student_bills")
        .select("id")
        .eq("academic_year_id", academicYearId!);
      if (!bills?.length) return [];
      const billIds = bills.map(b => b.id);
      const { data, error } = await supabase
        .from("student_payments")
        .select("*, students(full_name, student_id)")
        .in("bill_id", billIds)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!academicYearId,
  });
};

export const useRecordStudentPayment = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { bill_id: string; student_id: string; amount: number; payment_method: string; payment_date: string; notes?: string }) => {
      const { data, error } = await supabase.from("student_payments").insert({ ...values, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["student-payments"] });
      qc.invalidateQueries({ queryKey: ["student-bills"] });
      qc.invalidateQueries({ queryKey: ["all-student-payments"] });
      toast.success(`Payment recorded. Receipt: ${data.receipt_number}`);
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useGenerateAllBills = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("generate_all_student_bills");
      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["student-bills"] });
      toast.success(`Bills generated for ${count} students`);
    },
    onError: (e: any) => toast.error(e.message),
  });
};
