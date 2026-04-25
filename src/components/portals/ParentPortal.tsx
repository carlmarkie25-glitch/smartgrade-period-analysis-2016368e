import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users } from "lucide-react";
import StudentPortalView from "./StudentPortalView";
import { useMyChildren } from "@/hooks/usePortalData";
import { Separator } from "@/components/ui/separator";

const ParentPortal = () => {
  const { data: children, isLoading } = useMyChildren();

  return (
    <AppShell activeTab="dashboard">
      <div className="flex flex-col gap-8 pb-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] glass-panel flex items-center justify-center border border-white/20 p-1.5 shadow-none">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">
                <Users className="size-8" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1.5">Family Intelligence Hub</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Parent <span className="text-primary">Portal</span>
              </h1>
            </div>
          </div>
          
          {children && children.length > 0 && (
            <div className="flex items-center gap-4 glass-panel px-6 py-3 rounded-[1.5rem] shadow-none">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-black text-white/80 uppercase tracking-[0.2em]">
                {children.length} Authorized {children.length === 1 ? "Node" : "Nodes"}
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array(2).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-[3rem] bg-white/5" />
            ))}
          </div>
        ) : !children || children.length === 0 ? (
          <div className="glass-card p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-rose-400" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tighter mb-2">No active linkages detected</h3>
            <p className="text-sm text-white/40 max-w-sm font-bold uppercase tracking-widest leading-relaxed">
              Your identity is not currently associated with any student nodes. Please contact central administration to synchronize your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {children.map((child: any, idx: number) => (
              <div key={child.id} className="animate-in fade-in slide-in-from-bottom-8 duration-1000" style={{ animationDelay: `${idx * 200}ms` }}>
                {idx > 0 && <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-16" />}
                <StudentPortalView student={child} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ParentPortal;
