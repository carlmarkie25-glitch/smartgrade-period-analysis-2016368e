import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  backgroundColor?: string;
  iconBackgroundColor?: string;
  iconColor?: string;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  backgroundColor = "bg-teal-50/60",
  iconBackgroundColor = "bg-teal-100/60",
  iconColor = "text-teal-600",
}: StatCardProps) => {
  return (
    <div
      className={`${backgroundColor} rounded-xl backdrop-blur-sm border border-teal-200/30 p-4 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between h-full`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600/80 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`${iconBackgroundColor} rounded-full p-2 flex-shrink-0`}>
          <Icon className={`${iconColor} size-4`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs font-semibold">
          <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-gray-500">{trend.isPositive ? "increase" : "decrease"}</span>
        </div>
      )}
    </div>
  );
};
