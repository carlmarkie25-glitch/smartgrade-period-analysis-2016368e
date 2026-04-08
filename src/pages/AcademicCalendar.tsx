import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAcademicEvents, EVENT_TYPES, type AcademicEvent } from "@/hooks/useAcademicEvents";
import { useAcademicPeriods, type AcademicPeriod } from "@/hooks/useAcademicPeriods";
import { useUserRoles } from "@/hooks/useUserRoles";
import { parseISO, isWithinInterval } from "date-fns";
import { CalendarDays, Eye, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AcademicEventManagementTab } from "@/components/AcademicEventManagementTab";
import { AcademicPeriodManagement } from "@/components/AcademicPeriodManagement";
import PeriodWeeklyGrid from "@/components/PeriodWeeklyGrid";

const CalendarPreview = () => {
  const { data: events, isLoading: eventsLoading } = useAcademicEvents();
  const { data: periods, isLoading: periodsLoading } = useAcademicPeriods();

  const isLoading = eventsLoading || periodsLoading;

  const getEventsForPeriod = (period: AcademicPeriod) => {
    if (!events) return [];
    try {
      const pStart = parseISO(period.start_date);
      const pEnd = parseISO(period.end_date);
      return events.filter((event) => {
        const eStart = parseISO(event.start_date);
        const eEnd = event.end_date ? parseISO(event.end_date) : eStart;
        try {
          return isWithinInterval(eStart, { start: pStart, end: pEnd }) ||
            isWithinInterval(eEnd, { start: pStart, end: pEnd });
        } catch { return false; }
      });
    } catch { return []; }
  };

  const semester1 = useMemo(() => periods?.filter((p) => p.semester === "semester1") || [], [periods]);
  const semester2 = useMemo(() => periods?.filter((p) => p.semester === "semester2") || [], [periods]);

  if (isLoading) return <p className="text-muted-foreground py-8 text-center">Loading calendar...</p>;

  if (!periods || periods.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No academic periods configured yet.</p>
          <p className="text-sm text-muted-foreground">Set up period dates in the Manage tab.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Legend */}
      <div className="neu-card p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Event Legend</p>
        <div className="flex flex-wrap gap-3">
          {EVENT_TYPES.map((t) => (
            <div key={t.value} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-xs text-muted-foreground">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Semester 1 */}
      {semester1.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Semester 1
          </h2>
          {semester1.map((period) => (
            <PeriodWeeklyGrid
              key={period.id}
              period={period}
              events={getEventsForPeriod(period)}
            />
          ))}
        </div>
      )}

      {/* Semester 2 */}
      {semester2.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Semester 2
          </h2>
          {semester2.map((period) => (
            <PeriodWeeklyGrid
              key={period.id}
              period={period}
              events={getEventsForPeriod(period)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AcademicCalendar = () => {
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();

  return (
    <AppShell activeTab="schedule">
      <div className="py-4">
        <div className="neu-card p-6 mb-6">
          <h1 className="text-3xl font-bold text-foreground">Academic Calendar</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Manage periods, events, and view the calendar" : "Term-based overview of the academic year"}
          </p>
        </div>

        {rolesLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isAdmin ? (
          <Tabs defaultValue="preview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="periods">
                <CalendarDays className="h-4 w-4 mr-2" />
                Manage Periods
              </TabsTrigger>
              <TabsTrigger value="events">
                <Settings2 className="h-4 w-4 mr-2" />
                Manage Events
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <CalendarPreview />
            </TabsContent>
            <TabsContent value="periods">
              <AcademicPeriodManagement />
            </TabsContent>
            <TabsContent value="events">
              <AcademicEventManagementTab />
            </TabsContent>
          </Tabs>
        ) : (
          <CalendarPreview />
        )}
      </div>
    </AppShell>
  );
};

export default AcademicCalendar;
