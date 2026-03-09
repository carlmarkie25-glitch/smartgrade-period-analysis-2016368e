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
      <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" opacity={0.6} vertical={false} />
        <XAxis
          dataKey="month"
          stroke="hsl(220,9%,60%)"
          style={{ fontSize: "10px", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="hsl(220,9%,60%)"
          style={{ fontSize: "10px", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(0,0%,100%)",
            border: "1px solid hsl(220,13%,91%)",
            borderRadius: "12px",
            boxShadow: "var(--shadow-md)",
            fontSize: "11px",
          }}
          cursor={{ fill: "hsl(220,14%,96%)" }}
        />
        <Bar dataKey="students" fill="url(#primaryBarGradient)" radius={[6, 6, 2, 2]} barSize={12} />
        <Bar dataKey="capacity" fill="hsl(220,13%,91%)" radius={[6, 6, 2, 2]} barSize={12} />
        <defs>
          <linearGradient id="primaryBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(220,70%,35%)" stopOpacity={1} />
            <stop offset="100%" stopColor="hsl(220,70%,50%)" stopOpacity={0.75} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );

  if (!standalone) return chart;

  return (
    <div
      className="rounded-[22px] p-6 bg-card border border-border/60"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {totalStudents !== undefined && (
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="text-lg font-bold text-foreground mr-1">{totalStudents}</span>
              Total Enrolled
            </p>
          )}
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-muted border border-border/50">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Weekly</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="rounded-[16px] p-4 bg-muted/40 border border-border/40">
        {chart}
      </div>
    </div>
  );
};
