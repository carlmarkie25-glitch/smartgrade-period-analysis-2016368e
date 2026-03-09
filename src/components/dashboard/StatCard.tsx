import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  backgroundColor?: string;
  iconBackgroundColor?: string;
  iconColor?: string;
  highlighted?: boolean;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = "text-gray-500",
  highlighted = false,
}: StatCardProps) => {
  return (
    <div
      className="flex flex-col items-center justify-center p-4 md:p-5 rounded-[18px] transition-all duration-300 h-full w-full"
      style={{
        background: "hsl(170, 25%, 96%)",
        boxShadow: highlighted
          ? "inset 4px 4px 8px hsl(170, 25%, 88%), inset -4px -4px 8px hsl(0, 0%, 100%)"
          : "6px 6px 12px hsl(170, 25%, 88%), -6px -6px 12px hsl(0, 0%, 100%)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{
          background: "hsl(170, 25%, 96%)",
          boxShadow: "inset 3px 3px 6px hsl(170, 25%, 88%), inset -3px -3px 6px hsl(0, 0%, 100%)",
        }}
      >
        <Icon className={`size-5 md:size-6 ${iconColor}`} />
      </div>
      <h3 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight leading-none mb-1">{value}</h3>
      <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest text-center">{title}</p>
    </div>
  );
};
