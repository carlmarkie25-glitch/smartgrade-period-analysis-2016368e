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
  highlighted?: boolean;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  backgroundColor = "bg-[hsl(170,40%,95%)]",
  iconBackgroundColor = "bg-[hsl(170,40%,88%)]",
  iconColor = "text-[hsl(170,50%,35%)]",
  highlighted = false,
}: StatCardProps) => {
  return (
    <div
      className={`${highlighted ? 'bg-[hsl(170,45%,92%)] border-[hsl(170,50%,75%)]' : backgroundColor + ' border-transparent'} rounded-xl border p-2.5 flex items-center gap-3 transition-shadow duration-300 hover:shadow-md h-full`}
    >
      <div className={`${iconBackgroundColor} rounded-full p-2 flex-shrink-0`}>
        <Icon className={`${iconColor} size-4`} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-2xl font-bold text-gray-900 leading-tight">{value}</h3>
        <p className="text-[10px] font-medium text-gray-500 truncate">{title}</p>
      </div>
    </div>
  );
};
