import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useFeeCategories = () => {
  return useQuery({
    queryKey: ["fee-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateFeeCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; display_order?: number; is_registration?: boolean }) => {
      const { error } = await supabase.from("fee_categories").insert(values);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-categories"] }); toast.success("Fee category added"); },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteFeeCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-categories"] }); toast.success("Fee category deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDivisionFeeRates = (academicYearId?: string) => {
  return useQuery({
    queryKey: ["division-fee-rates", academicYearId],
    queryFn: async () => {
      let query = supabase
        .from("division_fee_rates")
        .select("*, fee_categories(name, display_order), departments(name)");
      if (academicYearId) {
        query = query.eq("academic_year_id", academicYearId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!academicYearId,
  });
};

export const useUpsertDivisionFeeRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { fee_category_id: string; department_id: string; academic_year_id: string; amount: number }) => {
      const { error } = await supabase
        .from("division_fee_rates")
        .upsert(values, { onConflict: "fee_category_id,department_id,academic_year_id" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["division-fee-rates"] }); },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useInstallmentPlans = (academicYearId?: string) => {
  return useQuery({
    queryKey: ["installment-plans", academicYearId],
    queryFn: async () => {
      let query = supabase
        .from("installment_plans")
        .select("*, departments(name)")
        .order("installment_number");
      if (academicYearId) {
        query = query.eq("academic_year_id", academicYearId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!academicYearId,
  });
};

export const useUpsertInstallmentPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { department_id: string; academic_year_id: string; installment_number: number; label: string; period_label: string; amount: number; due_date?: string }) => {
      const { error } = await supabase
        .from("installment_plans")
        .upsert(values, { onConflict: "department_id,academic_year_id,installment_number" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["installment-plans"] }); },
    onError: (e: any) => toast.error(e.message),
  });
};
