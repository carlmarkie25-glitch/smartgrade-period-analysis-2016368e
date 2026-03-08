import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface PassFailChartProps {
  passRate: number;
  failRate: number;
  awaitingGrades?: boolean;
}

const PassFailChart = ({ passRate, failRate, awaitingGrades }: PassFailChartProps) => {
  const data = [
    { name: "Passing", value: passRate, color: "hsl(170,50%,40%)" },
    { name: "Failing", value: failRate, color: "hsl(0,60%,55%)" },
  ];

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Pass/Fail Distribution</h3>
        <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">Ratio</span>
      </div>
      <div className="h-[220px]">
        {awaitingGrades ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-[160px] h-[160px] rounded-full border-[16px] border-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-300">No data yet</span>
            </div>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.9)",
                borderColor: "hsl(170,30%,85%)",
                borderRadius: "12px",
                fontSize: "11px",
              }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        )}
      </div>
      <div className="flex justify-center gap-6 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[hsl(170,50%,40%)]" />
          <span className="text-[10px] text-gray-500">Pass {passRate}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[hsl(0,60%,55%)]" />
          <span className="text-[10px] text-gray-500">Fail {failRate}%</span>
        </div>
      </div>
    </div>
  );
};

export default PassFailChart;
