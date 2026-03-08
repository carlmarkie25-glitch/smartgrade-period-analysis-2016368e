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
    if (average >= 70) return "hsl(170,50%,40%)";
    if (average >= 50) return "hsl(35,60%,50%)";
    return "hsl(0,60%,55%)";
  };

  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-[250px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Class Performance Comparison</h3>
        <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">All Classes</span>
      </div>
      <div className="h-[250px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-xs">No class data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(170,20%,90%)" />
              <XAxis
                type="number"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="className"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  borderColor: "hsl(170,30%,85%)",
                  borderRadius: "12px",
                  fontSize: "11px",
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Average"]}
              />
              <Bar dataKey="average" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.average)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ClassPerformanceChart;
