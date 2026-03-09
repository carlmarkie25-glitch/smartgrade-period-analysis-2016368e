import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useExpenses } from "@/hooks/useFinance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

const COLORS = ["hsl(170,50%,40%)", "hsl(35,60%,50%)", "hsl(0,60%,55%)", "hsl(210,60%,50%)", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

const FinanceReports = () => {
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
      const current = years.find(y => y.is_current);
      setSelectedYear(current ? current.id : years[0].id);
    }
  }, [years, selectedYear]);

  const { data: bills } = useQuery({
    queryKey: ["finance-report-bills", selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_bills")
        .select("*, students(full_name, student_id, department_id, class_id, classes:class_id(name), departments:department_id(name))")
        .eq("academic_year_id", selectedYear)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedYear,
  });

  const { data: expenses } = useExpenses();

  const totalBilled = bills?.reduce((s, b) => s + Number(b.grand_total), 0) || 0;
  const totalRevenue = bills?.reduce((s, b) => s + Number(b.amount_paid), 0) || 0;
  const totalOutstanding = bills?.reduce((s, b) => s + Number(b.balance), 0) || 0;
  const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;
  const netIncome = totalRevenue - totalExpenses;

  const paidCount = bills?.filter(b => b.status === "paid").length || 0;
  const partialCount = bills?.filter(b => b.status === "partial").length || 0;
  const pendingCount = bills?.filter(b => b.status === "pending").length || 0;

  const statusData = [
    { name: "Paid", value: paidCount },
    { name: "Partial", value: partialCount },
    { name: "Pending", value: pendingCount },
  ].filter(d => d.value > 0);

  const expenseByCategory = expenses?.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>) || {};

  const expenseCategoryData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  const stats = [
    { label: "Total Billed", value: totalBilled, icon: DollarSign, bgColor: "bg-[hsl(210,60%,96%)]", iconBg: "bg-[hsl(210,60%,90%)]", iconColor: "text-[hsl(210,60%,45%)]" },
    { label: "Total Collected", value: totalRevenue, icon: TrendingUp, bgColor: "bg-[hsl(170,45%,95%)]", iconBg: "bg-[hsl(170,45%,88%)]", iconColor: "text-[hsl(170,50%,35%)]" },
    { label: "Outstanding", value: totalOutstanding, icon: AlertCircle, bgColor: "bg-[hsl(35,60%,96%)]", iconBg: "bg-[hsl(35,60%,90%)]", iconColor: "text-[hsl(35,60%,40%)]" },
    { label: "Total Expenses", value: totalExpenses, icon: TrendingDown, bgColor: "bg-[hsl(0,60%,96%)]", iconBg: "bg-[hsl(0,60%,90%)]", iconColor: "text-[hsl(0,50%,45%)]" },
  ];

  return (
    <AppShell>
      <div className="py-4 space-y-4">
        <div className="neu-card p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Financial Reports</h1>
            <p className="text-sm text-gray-500">Overview of school finances</p>
          </div>
          {years && years.length > 0 && (
            <select
              className="neu-pill px-3 py-1.5 text-xs text-gray-900 outline-none"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              {years.map(y => (
                <option key={y.id} value={y.id}>{y.year_name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Stats */}
        <div className="neu-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Financial Overview</h3>
            <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">Summary</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`p-3 rounded-xl ${s.bgColor} transition-colors`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-gray-500">{s.label}</span>
                    <div className={`w-7 h-7 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                      <Icon className={`h-3.5 w-3.5 ${s.iconColor}`} />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{s.value.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Net Income */}
        <div className={`bg-white/70 backdrop-blur-md rounded-2xl border p-4 shadow-sm ${netIncome >= 0 ? "border-[hsl(170,40%,80%)]/50" : "border-[hsl(0,40%,85%)]/50"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-gray-500">Net Income (Collected − Expenses)</p>
              <p className={`text-2xl font-bold mt-1 ${netIncome >= 0 ? "text-[hsl(170,50%,35%)]" : "text-[hsl(0,60%,50%)]"}`}>
                {netIncome.toLocaleString()}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${netIncome >= 0 ? "bg-[hsl(170,45%,92%)]" : "bg-[hsl(0,50%,94%)]"}`}>
              <DollarSign className={`h-5 w-5 ${netIncome >= 0 ? "text-[hsl(170,50%,35%)]" : "text-[hsl(0,60%,50%)]"}`} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Student Bill Status</h3>
              <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">Distribution</span>
            </div>
            {statusData.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-xs">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value" label>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", borderColor: "hsl(170,30%,85%)", borderRadius: "12px", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Expenses by Category</h3>
              <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">Breakdown</span>
            </div>
            {expenseCategoryData.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-xs">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={expenseCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(170,20%,90%)" />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: "#9ca3af" }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", borderColor: "hsl(170,30%,85%)", borderRadius: "12px", fontSize: "11px" }} />
                  <Bar dataKey="value" fill="hsl(170,50%,40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default FinanceReports;
