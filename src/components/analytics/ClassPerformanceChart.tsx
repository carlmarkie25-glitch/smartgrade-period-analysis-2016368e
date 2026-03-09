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
      <div
        className="rounded-[22px] p-5"
        style={{
          background: "hsl(170, 25%, 96%)",
          boxShadow: "8px 8px 16px hsl(170, 25%, 88%), -8px -8px 16px hsl(0, 0%, 100%)",
        }}
      >
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-[250px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div
      className="rounded-[22px] p-5"
      style={{
        background: "hsl(170, 25%, 96%)",
        boxShadow: "8px 8px 16px hsl(170, 25%, 88%), -8px -8px 16px hsl(0, 0%, 100%)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700">Class Performance Comparison</h3>
        <span
          className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 rounded-full"
          style={{
            background: "hsl(170, 25%, 96%)",
            boxShadow: "inset 2px 2px 4px hsl(170, 25%, 88%), inset -2px -2px 4px hsl(0, 0%, 100%)",
          }}
        >
          All Classes
        </span>
      </div>
      <div
        className="rounded-[16px] p-3 h-[250px]"
        style={{
          background: "hsl(170, 25%, 96%)",
          boxShadow: "inset 4px 4px 8px hsl(170, 25%, 88%), inset -4px -4px 8px hsl(0, 0%, 100%)",
        }}
      >
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-xs">No class data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(170,20%,90%)" />
              <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis type="category" dataKey="className" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(170, 25%, 97%)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "4px 4px 8px hsl(170,25%,88%), -4px -4px 8px hsl(0,0%,100%)",
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
