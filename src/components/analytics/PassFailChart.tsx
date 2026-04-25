import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface PassFailChartProps {
  passRate: number;
  failRate: number;
  awaitingGrades?: boolean;
}

const PassFailChart = ({ passRate, failRate, awaitingGrades }: PassFailChartProps) => {
  const data = [
    { name: "Passing", value: passRate || (awaitingGrades ? 0 : 0), color: "hsl(142, 76%, 50%)" },
    { name: "At Risk", value: failRate || (awaitingGrades ? 0 : 0), color: "hsl(0, 84%, 60%)" },
  ];

  if (awaitingGrades) {
    data[0].value = 0;
    data[1].value = 0;
  }

  return (
    <div className="relative w-full h-[240px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={awaitingGrades ? [{ value: 100 }] : data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={awaitingGrades ? 0 : 8}
            dataKey="value"
            stroke="none"
          >
            {awaitingGrades ? (
              <Cell fill="rgba(255, 255, 255, 0.05)" />
            ) : (
              data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} className="transition-all hover:opacity-80" />
              ))
            )}
          </Pie>
          {!awaitingGrades && (
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
              formatter={(value: number) => [`${value}%`, ""]}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {awaitingGrades ? (
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Pending</span>
        ) : (
          <>
            <span className="text-3xl font-black text-white tracking-tighter leading-none">{passRate}%</span>
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Success</span>
          </>
        )}
      </div>
    </div>
  );
};

export default PassFailChart;
