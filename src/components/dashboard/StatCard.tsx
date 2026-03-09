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
  iconColor = "text-primary",
  highlighted = false,
}: StatCardProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-4 md:p-5 rounded-[18px] transition-all duration-200 h-full w-full bg-card border border-border/60 ${
        highlighted ? "ring-2 ring-primary/20" : ""
      }`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3 bg-muted/60">
        <Icon className={`size-5 ${iconColor}`} />
      </div>
      <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-none mb-1">
        {value}
      </h3>
      <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
        {title}
      </p>
    </div>
  );
};
