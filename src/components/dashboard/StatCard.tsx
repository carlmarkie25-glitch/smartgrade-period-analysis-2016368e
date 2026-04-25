import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  highlighted?: boolean;
  iconColor?: string;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  highlighted = false,
  iconColor = "text-primary",
}: StatCardProps) => {
  return (
    <div
      className={`p-6 transition-all duration-500 group shadow-none glass-card ${highlighted ? "border-primary/50" : ""} hover:scale-105`}
    >
      <div className="flex flex-row items-center justify-between space-y-0 pb-4">
        <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{title}</h3>
        <div className={`p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tighter leading-none mb-1">{value}</div>
        {description && (
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
            {description}
          </p>
        )}
        {trend && (
          <div className={`text-xs font-bold mt-2 flex items-center gap-1 ${trend.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
            <span className="text-white/20 text-[9px] font-medium uppercase tracking-tighter">vs last term</span>
          </div>
        )}
      </div>
    </div>
  );
};
