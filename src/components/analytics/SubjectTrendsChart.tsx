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
      <div
        className="rounded-[22px] p-5"
        style={{
          background: "hsl(170, 25%, 96%)",
          boxShadow: "8px 8px 16px hsl(170, 25%, 88%), -8px -8px 16px hsl(0, 0%, 100%)",
        }}
      >
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-[220px] w-full rounded-xl" />
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
        <h3 className="text-sm font-bold text-gray-700">Performance Trend</h3>
        <span
          className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 rounded-full"
          style={{
            background: "hsl(170, 25%, 96%)",
            boxShadow: "inset 2px 2px 4px hsl(170, 25%, 88%), inset -2px -2px 4px hsl(0, 0%, 100%)",
          }}
        >
          By Period
        </span>
      </div>
      <div
        className="rounded-[16px] p-3 h-[220px]"
        style={{
          background: "hsl(170, 25%, 96%)",
          boxShadow: "inset 4px 4px 8px hsl(170, 25%, 88%), inset -4px -4px 8px hsl(0, 0%, 100%)",
        }}
      >
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-xs">Awaiting complete grades to display trends</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAverageTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(170,50%,40%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(170,50%,40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(170,20%,90%)" />
              <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} domain={[0, 100]} />
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
              <Area type="monotone" dataKey="average" stroke="hsl(170,50%,40%)" strokeWidth={2} fillOpacity={1} fill="url(#colorAverageTeal)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SubjectTrendsChart;
