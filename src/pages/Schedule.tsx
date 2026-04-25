import React from "react";
import AppShell from "@/components/AppShell";
import { useSchedule } from "@/hooks/useSchedule";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CalendarDays, Eye, LayoutGrid } from "lucide-react";
import { ClassScheduleManagementTab } from "@/components/ClassScheduleManagementTab";
import { ClassScheduleTimetable } from "@/components/ClassScheduleTimetable";

const Schedule = () => {
  const { data, isLoading, error } = useSchedule();
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();

  const schedulePreview = (
    <div>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Eye className="h-5 w-5 text-primary" />
        Today's Schedule Preview
      </h2>
      {isLoading && <Skeleton className="h-6 w-40 mb-4" />}
      {error && <p className="text-destructive">Failed to load schedule.</p>}
      {!isLoading && data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.subject || "Class"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm">
                  {format(new Date(`${item.date}T${item.start_time}`), "p")} -{" "}
                  {format(new Date(`${item.date}T${item.end_time}`), "p")}
                </p>
                {item.location && <p className="text-sm text-muted-foreground">{item.location}</p>}
                {(item as any).teacher_name && (
                  <p className="text-sm text-muted-foreground">Teacher: {(item as any).teacher_name}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !isLoading && <p className="text-muted-foreground">No scheduled activities for today.</p>
      )}
    </div>
  );

  return (
    <AppShell activeTab="schedule">
      <div className="flex flex-col gap-6 pb-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] glass-panel flex items-center justify-center border border-white/20 p-1.5 shadow-none">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">
                <CalendarDays className="size-8" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1.5">Academic Planning</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Schedule
              </h1>
            </div>
          </div>
        </div>

        <div className="glass-card p-1 pb-2 overflow-hidden">
          {rolesLoading ? (
            <div className="p-8">
              <Skeleton className="h-40 w-full rounded-2xl bg-white/5" />
            </div>
          ) : isAdmin ? (
            <Tabs defaultValue="manage" className="w-full">
              <div className="px-8 pt-8 pb-4">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl">
                  <TabsTrigger value="manage" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest px-6 h-10 transition-all">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Manage
                  </TabsTrigger>
                  <TabsTrigger value="timetable" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest px-6 h-10 transition-all">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Timetable
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest px-6 h-10 transition-all">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="manage" className="mt-0 focus-visible:outline-none">
                <div className="p-8">
                  <ClassScheduleManagementTab />
                </div>
              </TabsContent>
              <TabsContent value="timetable" className="mt-0 focus-visible:outline-none">
                <div className="p-8">
                  <ClassScheduleTimetable />
                </div>
              </TabsContent>
              <TabsContent value="preview" className="mt-0 focus-visible:outline-none">
                <div className="p-8">
                  {schedulePreview}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="p-8">
              <ClassScheduleTimetable />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Schedule;
