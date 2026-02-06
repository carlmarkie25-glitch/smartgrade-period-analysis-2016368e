import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: number;
  colorClass: string;
}

interface StatsWidgetProps {
  title: string;
  stats: StatItem[];
}

const StatsWidget = ({ title, stats }: StatsWidgetProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{stat.label}</span>
              <span className="font-medium">{stat.value}%</span>
            </div>
            <Progress 
              value={stat.value} 
              className="h-2"
              indicatorClassName={cn(stat.colorClass)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default StatsWidget;
