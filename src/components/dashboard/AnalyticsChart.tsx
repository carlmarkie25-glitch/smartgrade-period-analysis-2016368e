import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  month: string;
  students: number;
  capacity: number;
}

interface AnalyticsChartProps {
  data: AnalyticsData[];
  title?: string;
  height?: number;
  standalone?: boolean;
}

export const AnalyticsChart = ({
  data,
  title = "Enrollment Analytics",
  height = 120,
  standalone = false,
}: AnalyticsChartProps) => {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="0" stroke="hsl(170,20%,92%)" opacity={0.4} vertical={false} />
        <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: "9px", fontWeight: 500 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#94a3b8" style={{ fontSize: "9px", fontWeight: 500 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255,255,255,0.95)",
            border: "1px solid hsl(170,30%,90%)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: "11px",
          }}
          cursor={{ fill: "hsla(170,30%,50%,0.05)" }}
        />
        <Bar dataKey="students" fill="url(#tealGradient)" radius={[4, 4, 0, 0]} barSize={16} />
        <Bar dataKey="capacity" fill="hsl(170,15%,90%)" radius={[4, 4, 0, 0]} barSize={16} />
        <defs>
          <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(170,60%,45%)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="hsl(170,50%,55%)" stopOpacity={0.6} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );

  if (!standalone) return chart;

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">Weekly</span>
      </div>
      {chart}
    </div>
  );
};
