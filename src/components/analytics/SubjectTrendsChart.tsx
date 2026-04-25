import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface SubjectTrendData {
  period: string;
  average: number;
}

interface SubjectTrendsChartProps {
  data: SubjectTrendData[];
  isLoading?: boolean;
}

const SubjectTrendsChart = ({ data, isLoading }: SubjectTrendsChartProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32 bg-white/5" />
        <Skeleton className="h-[220px] w-full rounded-2xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {data.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
             <TrendingUp className="size-6 text-white/20" />
          </div>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Awaiting trend data</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis 
              dataKey="period" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "rgba(255, 255, 255, 0.3)", fontSize: 10, fontWeight: "900" }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "rgba(255, 255, 255, 0.3)", fontSize: 10, fontWeight: "900" }} 
              domain={[0, 100]} 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                fontSize: "11px",
                fontWeight: "900",
                color: "white",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
              itemStyle={{ color: "white" }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, "Average"]}
            />
            <Area 
              type="monotone" 
              dataKey="average" 
              stroke="hsl(220, 70%, 50%)" 
              strokeWidth={4} 
              fillOpacity={1} 
              fill="url(#colorTrend)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SubjectTrendsChart;
