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
    <div
      className="rounded-[22px] p-5"
      style={{
        background: "hsl(170, 25%, 96%)",
        boxShadow: "8px 8px 16px hsl(170, 25%, 88%), -8px -8px 16px hsl(0, 0%, 100%)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700">Pass/Fail Distribution</h3>
        <span
          className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 rounded-full"
          style={{
            background: "hsl(170, 25%, 96%)",
            boxShadow: "inset 2px 2px 4px hsl(170, 25%, 88%), inset -2px -2px 4px hsl(0, 0%, 100%)",
          }}
        >
          Ratio
        </span>
      </div>
      <div
        className="rounded-[16px] p-3 h-[220px]"
        style={{
          background: "hsl(170, 25%, 96%)",
          boxShadow: "inset 4px 4px 8px hsl(170, 25%, 88%), inset -4px -4px 8px hsl(0, 0%, 100%)",
        }}
      >
        {awaitingGrades ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-[160px] h-[160px] rounded-full border-[16px] border-[hsl(170,20%,90%)] flex items-center justify-center">
              <span className="text-xs text-gray-300">No data yet</span>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value" labelLine={false}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(170, 25%, 97%)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "4px 4px 8px hsl(170,25%,88%), -4px -4px 8px hsl(0,0%,100%)",
                  fontSize: "11px",
                }}
                formatter={(value: number) => [`${value}%`, ""]}
              />
              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex justify-center gap-6 mt-3">
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
