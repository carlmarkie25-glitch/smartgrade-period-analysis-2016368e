import {
  AreaChart,
  Area,
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
      <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="navyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C084FC" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#C084FC" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="white" className="opacity-5" vertical={false} />
        <XAxis dataKey="month" stroke="white" className="opacity-40 text-[9px] font-black uppercase tracking-widest" axisLine={false} tickLine={false} />
        <YAxis stroke="white" className="opacity-40 text-[9px] font-black uppercase tracking-widest" axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "16px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            fontSize: "11px",
            fontWeight: "900",
            backdropFilter: "blur(20px)",
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
          itemStyle={{ color: "white" }}
          cursor={{ stroke: "#C084FC", strokeWidth: 1, strokeDasharray: "4 4", fill: "transparent" }}
        />
        <Area type="monotone" dataKey="capacity" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#navyGradient)" />
        <Area type="monotone" dataKey="students" stroke="#C084FC" strokeWidth={4} fillOpacity={1} fill="url(#purpleGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );

  if (!standalone) return chart;

  return (
    <div
      className="rounded-[26px] p-6 md:p-7 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
          {totalStudents !== undefined && (
            <p className="text-[10px] text-white/50 mt-1 uppercase font-bold tracking-tight">
              <span className="text-base font-black text-white mr-1">{totalStudents}</span>
              Total Enrolled Students
            </p>
          )}
        </div>
        <div
          className="px-4 py-1.5 rounded-full flex items-center bg-white/10 border border-white/20"
        >
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Weekly</span>
        </div>
      </div>

      {/* Chart Inner Container */}
      <div
        className="rounded-[18px] p-4 bg-white/5 border border-white/10"
      >
        {chart}
      </div>
    </div>
  );
};
