import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface SummaryStat {
  value: string;
  label: string;
}

interface SummaryCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  stats: SummaryStat[];
}

const SummaryCard = ({ title, subtitle, icon: Icon, stats }: SummaryCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
