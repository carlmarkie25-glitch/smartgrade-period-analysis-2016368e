import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface PassFailChartProps {
  passRate: number;
  failRate: number;
}

const PassFailChart = ({ passRate, failRate }: PassFailChartProps) => {
  const data = [
    { name: "Passing", value: passRate, color: "hsl(var(--success))" },
    { name: "Failing", value: failRate, color: "hsl(var(--destructive))" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Pass/Fail Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value}%`, ""]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PassFailChart;
