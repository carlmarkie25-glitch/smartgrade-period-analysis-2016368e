import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useExpenses } from "@/hooks/useFinance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

const COLORS = ["hsl(220,60%,35%)", "hsl(35,60%,50%)", "hsl(0,60%,55%)", "hsl(210,60%,50%)", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

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
    { label: "Total Billed", value: totalBilled, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "Collected", value: totalRevenue, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Outstanding", value: totalOutstanding, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Expenses", value: totalExpenses, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  return (
    <AppShell activeTab="finance">
      <div className="flex flex-col gap-8 pb-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] glass-panel flex items-center justify-center border border-white/20 p-1.5 shadow-none">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">
                <DollarSign className="size-8" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1.5">Treasury Management</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Finance <span className="text-secondary">Reports</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 glass-panel px-6 py-3 rounded-[1.5rem] shadow-none self-start lg:self-center">
             <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-secondary animate-ping opacity-40" />
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

        {/* Hero Performance Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] p-10 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white min-h-[260px] flex flex-col justify-between border border-white/10 shadow-none group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px] -mr-40 -mt-40 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[60px] -ml-32 -mb-32 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 border border-white/10 px-4 py-1.5 mb-6 backdrop-blur-md rounded-full uppercase tracking-widest text-[9px] font-black">
              <TrendingUp className="size-3 text-secondary" />
              Fiscal Performance Analytics
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.1] max-w-lg">
              Net Institutional <br/><span className="text-secondary">Financial Matrix</span>
            </h2>
          </div>

          <div className="relative z-10 flex flex-wrap items-end justify-between gap-8 pt-8">
            <div className="flex gap-12">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Net Income</p>
                <div className={`text-5xl font-black tracking-tighter flex items-baseline gap-1 ${netIncome >= 0 ? "text-white" : "text-rose-400"}`}>
                  {netIncome.toLocaleString()}<span className="text-xl text-white/40 font-bold">TOTAL</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Profitability</p>
                <div className="text-5xl font-black tracking-tighter flex items-baseline gap-1">
                  {totalRevenue > 0 ? Math.round((netIncome / totalRevenue) * 100) : 0}<span className="text-xl text-white/40 font-bold">%</span>
                </div>
              </div>
            </div>
            
            <div className={`flex items-center gap-5 glass-panel px-8 py-5 rounded-[2rem] transition-all hover:bg-white/15 cursor-pointer shadow-none ${netIncome >= 0 ? "border-secondary/30" : "border-rose-500/30"}`}>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] leading-none mb-1">Status</span>
                <span className={`text-sm font-black tracking-tight ${netIncome >= 0 ? "text-secondary" : "text-rose-400"}`}>
                  {netIncome >= 0 ? "SURPLUS" : "DEFICIT"}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${netIncome >= 0 ? "bg-secondary/20" : "bg-rose-500/20"}`}>
                {netIncome >= 0 ? <TrendingUp className="size-6 text-secondary" /> : <TrendingDown className="size-6 text-rose-500" />}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="p-6 glass-panel flex flex-col justify-between min-h-[140px] transition-all hover:bg-white/10 shadow-none group">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`size-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white tracking-tighter leading-none">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Expenses Chart */}
          <div className="glass-card p-8 min-h-[460px] flex flex-col border border-white/10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter leading-none">Expense Allocation</h3>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mt-2">Operational capital flow by category</p>
              </div>
              <div className="px-5 py-2 glass-pill text-[10px] font-black text-secondary uppercase tracking-widest border border-secondary/20">
                Category View
              </div>
            </div>
            
            <div className="flex-1 min-h-[300px]">
              {expenseCategoryData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">No Financial Data Detected</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseCategoryData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "rgba(255, 255, 255, 0.3)", fontSize: 9, fontWeight: "900", textTransform: "uppercase" }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "rgba(255, 255, 255, 0.3)", fontSize: 9, fontWeight: "900" }} 
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: [12, 12, 0, 0] }}
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: "900",
                        color: "white",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em"
                      }}
                      itemStyle={{ color: "white" }}
                      formatter={(value: number) => [`GHS ${value.toLocaleString()}`, "Amount"]}
                    />
                    <Bar dataKey="value" fill="url(#barGradient)" radius={[12, 12, 4, 4]} animationDuration={2000} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Revenue Distribution */}
          <div className="glass-card p-8 flex flex-col min-h-[460px] border border-white/10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-sm font-black text-white/70 uppercase tracking-widest">Collection Status</h3>
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="size-4 text-secondary" />
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
               {statusData.length === 0 ? (
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">No Billing Data</p>
              ) : (
                <>
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={statusData} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={80} 
                          outerRadius={110} 
                          paddingAngle={8} 
                          dataKey="value"
                          stroke="none"
                          animationDuration={1500}
                        >
                          {statusData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} className="transition-all hover:opacity-80 cursor-pointer" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "900",
                            color: "white",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                            textTransform: "uppercase",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
                      <span className="text-5xl font-black text-white tracking-tighter leading-none">{bills?.length || 0}</span>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-2">Total Invoices</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full mt-6">
                    {statusData.map((d, i) => (
                      <div key={d.name} className="flex flex-col items-center p-4 glass-panel !rounded-[1.8rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                        <div className="w-2.5 h-2.5 rounded-full mb-3" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{d.name}</span>
                        <span className="text-base font-black text-white tracking-tighter">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default FinanceReports;
