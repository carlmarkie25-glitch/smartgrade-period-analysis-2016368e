import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudentBills, useAllStudentPayments } from "@/hooks/useStudentBilling";
import { useExpenses } from "@/hooks/useFinance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--destructive))", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

const FinanceReports = () => {
  // Get current academic year with fallback
  const { data: currentYear } = useQuery({
    queryKey: ["current-academic-year-fallback"],
    queryFn: async () => {
      const { data: current } = await supabase
        .from("academic_years")
        .select("*")
        .eq("is_current", true)
        .limit(1)
        .maybeSingle();
      if (current) return current;
      const { data: fallback } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return fallback;
    },
  });

  const { data: bills } = useStudentBills(currentYear?.id);
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
    { label: "Total Billed", value: totalBilled, icon: DollarSign, color: "text-primary" },
    { label: "Total Collected", value: totalRevenue, icon: TrendingUp, color: "text-green-600" },
    { label: "Outstanding", value: totalOutstanding, icon: AlertCircle, color: "text-amber-600" },
    { label: "Total Expenses", value: totalExpenses, icon: TrendingDown, color: "text-red-600" },
  ];

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
          <p className="text-muted-foreground">
            Overview of school finances {currentYear ? `— ${currentYear.year_name}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold text-foreground">{s.value.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Net Income Card */}
        <Card className={netIncome >= 0 ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Income (Collected − Expenses)</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-destructive"}`}>
                {netIncome.toLocaleString()}
              </p>
            </div>
            <DollarSign className={`h-8 w-8 ${netIncome >= 0 ? "text-green-600" : "text-destructive"}`} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Student Bill Status</CardTitle></CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Expenses by Category</CardTitle></CardHeader>
            <CardContent>
              {expenseCategoryData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={expenseCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default FinanceReports;
