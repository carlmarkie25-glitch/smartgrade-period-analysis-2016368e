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
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-[220px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Performance Trend</h3>
        <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">By Period</span>
      </div>
      <div className="h-[220px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-xs">No trend data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(170,50%,40%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(170,50%,40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(170,20%,90%)" />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                domain={[0, 100]}
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
              <Area
                type="monotone"
                dataKey="average"
                stroke="hsl(170,50%,40%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAverage)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SubjectTrendsChart;
