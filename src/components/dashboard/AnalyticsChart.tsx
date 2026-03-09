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
  totalStudents?: number;
}

export const AnalyticsChart = ({
  data,
  title = "Enrollment Analytics",
  height = 120,
  standalone = false,
  totalStudents,
}: AnalyticsChartProps) => {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={3}>
        <CartesianGrid strokeDasharray="0" stroke="hsl(170,20%,92%)" opacity={0.3} vertical={false} />
        <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: "9px", fontWeight: 500 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#94a3b8" style={{ fontSize: "9px", fontWeight: 500 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255,255,255,0.98)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "6px 6px 12px hsl(220,20%,86%), -4px -4px 8px hsl(0,0%,100%)",
            fontSize: "11px",
          }}
          cursor={{ fill: "hsla(170,30%,50%,0.04)" }}
        />
        <Bar dataKey="students" fill="url(#tealGradientNeumorphic)" radius={[6, 6, 2, 2]} barSize={14} />
        <Bar dataKey="capacity" fill="url(#capacityGradient)" radius={[6, 6, 2, 2]} barSize={14} />
        <defs>
          <linearGradient id="tealGradientNeumorphic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(170,55%,48%)" stopOpacity={1} />
            <stop offset="100%" stopColor="hsl(170,45%,58%)" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(220,20%,88%)" stopOpacity={1} />
            <stop offset="100%" stopColor="hsl(220,20%,92%)" stopOpacity={0.8} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );

  if (!standalone) return chart;

  return (
    <div
      className="rounded-[26px] p-6 md:p-7"
      style={{
        background: "hsl(220, 20%, 96%)",
        boxShadow: "10px 10px 20px hsl(220, 20%, 87%), -10px -10px 20px hsl(0, 0%, 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-gray-700 tracking-tight">{title}</h3>
          {totalStudents !== undefined && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              <span className="text-base font-black text-gray-700 mr-1">{totalStudents}</span>
              Total Enrolled Students
            </p>
          )}
        </div>
        <div
          className="px-4 py-1.5 rounded-full flex items-center"
          style={{
            background: "hsl(220, 20%, 96%)",
            boxShadow: "inset 3px 3px 6px hsl(220, 20%, 88%), inset -3px -3px 6px hsl(0, 0%, 100%)",
          }}
        >
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Weekly</span>
        </div>
      </div>

      {/* Chart Inner Container */}
      <div
        className="rounded-[18px] p-4"
        style={{
          background: "hsl(220, 20%, 96%)",
          boxShadow: "inset 4px 4px 10px hsl(220, 20%, 88%), inset -4px -4px 10px hsl(0, 0%, 100%)",
        }}
      >
        {chart}
      </div>
    </div>
  );
};
