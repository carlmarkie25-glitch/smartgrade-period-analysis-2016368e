import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Link2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { ParentUsersTab } from "@/components/ParentUsersTab";
import { ParentChildrenOverviewTab } from "@/components/ParentChildrenOverviewTab";

const ParentPanel = () => {
  return (
    <AppShell activeTab="parents">
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
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1.5">Family Telemetry</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Parent <span className="text-primary">Management</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="p-8">
            <Tabs defaultValue="users" className="space-y-8">
              <TabsList className="inline-flex w-auto bg-white/5 border border-white/10 rounded-2xl p-1 mb-4">
                <TabsTrigger value="users" className="rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  <Users className="h-4 w-4 mr-2" />
                  Authorized Parents
                </TabsTrigger>
                <TabsTrigger value="children" className="rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  <Link2 className="h-4 w-4 mr-2" />
                  Child Linkages
                </TabsTrigger>
              </TabsList>

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <TabsContent value="users" className="mt-0"><ParentUsersTab /></TabsContent>
                <TabsContent value="children" className="mt-0"><ParentChildrenOverviewTab /></TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ParentPanel;
