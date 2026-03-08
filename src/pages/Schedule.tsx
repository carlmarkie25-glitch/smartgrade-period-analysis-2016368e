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
      <div className="py-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage class timetables and view today's schedule" : "View your daily schedule"}
          </p>
        </div>

        {rolesLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isAdmin ? (
          <Tabs defaultValue="manage" className="space-y-6">
            <TabsList>
              <TabsTrigger value="manage">
                <CalendarDays className="h-4 w-4 mr-2" />
                Manage Timetable
              </TabsTrigger>
              <TabsTrigger value="timetable">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Timetable View
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Today's Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manage">
              <ClassScheduleManagementTab />
            </TabsContent>
            <TabsContent value="timetable">
              <ClassScheduleTimetable />
            </TabsContent>
            <TabsContent value="preview">
              {schedulePreview}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <ClassScheduleTimetable />
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Schedule;
