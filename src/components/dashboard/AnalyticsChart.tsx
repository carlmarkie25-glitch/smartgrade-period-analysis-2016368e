import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChevronDown } from "lucide-react";

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
  height = 300,
  standalone = false,
}: AnalyticsChartProps) => {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="0" stroke="#e0e7ff" opacity={0.3} vertical={false} />
        <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: "11px", fontWeight: 500 }} axisLine={{ stroke: "#e0e7ff", opacity: 0.3 }} tickLine={false} />
        <YAxis stroke="#94a3b8" style={{ fontSize: "11px", fontWeight: 500 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #ccfbf1", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }} cursor={{ fill: "rgba(20,184,166,0.05)" }} />
        <Bar dataKey="students" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="capacity" fill="#e0e7ff" radius={[6, 6, 0, 0]} />
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.6} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );

  if (!standalone) return chart;

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-teal-200/30 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50/50 text-sm font-medium text-teal-700 hover:bg-teal-100/50 transition-colors">
          Weekly
          <ChevronDown size={16} />
        </button>
      </div>
      {chart}
    </div>
  );
};
