import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  "hsl(170, 50%, 40%)",
  "hsl(210, 60%, 50%)",
  "hsl(35, 60%, 50%)",
  "hsl(0, 50%, 50%)",
  "hsl(280, 50%, 50%)",
  "hsl(145, 50%, 40%)",
  "hsl(50, 60%, 45%)",
  "hsl(320, 50%, 45%)",
  "hsl(190, 55%, 45%)",
  "hsl(15, 55%, 50%)",
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
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[180px] w-full rounded-xl" />
      </div>
    );
  }

  const displayData = data.length > 8 ? [...data.slice(0, 7), { name: "Others", value: data.slice(7).reduce((s, d) => s + d.value, 0) }] : data;
  const total = displayData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="ml-auto text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">{total} total</span>
      </div>
      {displayData.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-8">No data available</p>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-2">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={displayData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                {displayData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, "Count"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center lg:justify-start">
            {displayData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-gray-600">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DemographicsChart;
