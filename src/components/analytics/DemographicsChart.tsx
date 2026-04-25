import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  "hsl(220, 70%, 50%)", // Navy Blue
  "hsl(45, 93%, 50%)",  // Gold
  "hsl(142, 76%, 50%)", // Success Green
  "hsl(0, 84%, 60%)",   // Error Red
  "hsl(280, 65%, 60%)", // Purple
  "hsl(200, 70%, 50%)", // Sky Blue
  "hsl(30, 90%, 50%)",  // Orange
  "hsl(180, 60%, 45%)", // Teal
];

interface DemographicsChartProps {
  title: string;
  data: { name: string; value: number }[];
  isLoading: boolean;
  icon: React.ReactNode;
}

const DemographicsChart = ({ title, data, isLoading, icon }: DemographicsChartProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32 bg-white/5" />
        <Skeleton className="h-[180px] w-full rounded-2xl bg-white/5" />
      </div>
    );
  }

  const displayData = data.length > 8 ? [...data.slice(0, 7), { name: "Others", value: data.slice(7).reduce((s, d) => s + d.value, 0) }] : data;
  const total = displayData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col h-full">
      {title && (
        <div className="flex items-center gap-2 mb-6">
          {icon}
          <h3 className="text-sm font-black text-white/70 uppercase tracking-widest">{title}</h3>
          <span className="ml-auto text-[10px] font-black text-white/30 uppercase tracking-widest">
            {total} total
          </span>
        </div>
      )}
      {displayData.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-8">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">No Data Available</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-full h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={displayData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={55} 
                  outerRadius={75} 
                  paddingAngle={4} 
                  dataKey="value"
                  stroke="none"
                >
                  {displayData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} className="transition-all hover:opacity-80" />
                  ))}
                </Pie>
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
                  formatter={(value: number) => [`${value} students`, "Count"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white tracking-tighter leading-none">{total}</span>
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center w-full">
            {displayData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 group cursor-default">
                <div className="w-2 h-2 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-tight group-hover:text-white/70 transition-colors">
                  {d.name}
                </span>
                <span className="text-[9px] font-black text-white/20">
                  {Math.round((d.value / (total || 1)) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DemographicsChart;
