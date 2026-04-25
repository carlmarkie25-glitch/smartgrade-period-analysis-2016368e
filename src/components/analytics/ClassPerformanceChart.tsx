import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassPerformanceData {
  className: string;
  average: number;
}

interface ClassPerformanceChartProps {
  data: ClassPerformanceData[];
  isLoading?: boolean;
}

const ClassPerformanceChart = ({ data, isLoading }: ClassPerformanceChartProps) => {
  const getBarColor = (average: number) => {
    if (average >= 70) return "hsl(142, 76%, 50%)"; // Success Green
    if (average >= 50) return "hsl(45, 93%, 50%)";  // Gold
    return "hsl(0, 84%, 60%)";   // Error Red
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-40 bg-white/5" />
        <Skeleton className="h-[250px] w-full rounded-2xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {data.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
             <BarChart className="size-6 text-white/20" />
          </div>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">No Class Data</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "rgba(255, 255, 255, 0.3)", fontSize: 10, fontWeight: "900" }} 
            />
            <YAxis 
              type="category" 
              dataKey="className" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "rgba(255, 255, 255, 0.3)", fontSize: 10, fontWeight: "900" }} 
              width={80} 
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
            <Bar dataKey="average" radius={[0, 4, 4, 0]} maxBarSize={24} animationDuration={1500}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.average)} className="transition-all hover:opacity-80" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ClassPerformanceChart;
