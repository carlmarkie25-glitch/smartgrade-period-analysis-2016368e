import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAcademicEvents, EVENT_TYPES, type AcademicEvent } from "@/hooks/useAcademicEvents";
import { useAcademicPeriods, type AcademicPeriod } from "@/hooks/useAcademicPeriods";
import { useUserRoles } from "@/hooks/useUserRoles";
import { format, parseISO, isWithinInterval } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, Clock, BookOpen, Eye, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AcademicEventManagementTab } from "@/components/AcademicEventManagementTab";
import { AcademicPeriodManagement } from "@/components/AcademicPeriodManagement";

const CalendarPreview = () => {
  const { data: events, isLoading: eventsLoading } = useAcademicEvents();
  const { data: periods, isLoading: periodsLoading } = useAcademicPeriods();
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);

  const isLoading = eventsLoading || periodsLoading;

  const getEventsForPeriod = (period: AcademicPeriod) => {
    if (!events) return [];
    const pStart = parseISO(period.start_date);
    const pEnd = parseISO(period.end_date);
    return events.filter((event) => {
      const eStart = parseISO(event.start_date);
      return isWithinInterval(eStart, { start: pStart, end: pEnd });
    });
  };

  const semester1 = useMemo(() => periods?.filter((p) => p.semester === "semester1") || [], [periods]);
  const semester2 = useMemo(() => periods?.filter((p) => p.semester === "semester2") || [], [periods]);

  const unassignedEvents = useMemo(() => {
    if (!events || !periods || periods.length === 0) return events || [];
    return events.filter((event) => {
      const eStart = parseISO(event.start_date);
      return !periods.some((p) => {
        try {
          return isWithinInterval(eStart, { start: parseISO(p.start_date), end: parseISO(p.end_date) });
        } catch { return false; }
      });
    });
  }, [events, periods]);

  const formatDateRange = (start: string, end: string) =>
    `${format(parseISO(start), "MMM d, yyyy")} — ${format(parseISO(end), "MMM d, yyyy")}`;

  const getPeriodStatus = (period: AcademicPeriod) => {
    const now = new Date();
    const start = parseISO(period.start_date);
    const end = parseISO(period.end_date);
    if (now < start) return "upcoming";
    if (now > end) return "completed";
    return "active";
  };

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
    <>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {EVENT_TYPES.map((t) => (
          <div key={t.value} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="text-xs text-muted-foreground">{t.label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {[
          { label: "Semester 1", periods: semester1 },
          { label: "Semester 2", periods: semester2 },
        ].map((sem) => (
          <div key={sem.label}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{sem.label}</h2>
            </div>
            <div className="space-y-4">
              {sem.periods.map((period) => {
                const periodEvents = getEventsForPeriod(period);
                const status = getPeriodStatus(period);
                return (
                  <Card
                    key={period.id}
                    className={`overflow-hidden transition-all ${
                      status === "active" ? "ring-2 ring-primary shadow-md" : status === "completed" ? "opacity-75" : ""
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">{period.label}</CardTitle>
                          <Badge variant={status === "active" ? "default" : "secondary"} className="text-[10px]">
                            {status === "active" ? "Current" : status === "completed" ? "Done" : "Upcoming"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDateRange(period.start_date, period.end_date)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {periodEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No events scheduled for this period.</p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {periodEvents.map((event) => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                            >
                              <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: event.color || "#64748b" }} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{event.title}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <span>{format(parseISO(event.start_date), "MMM d")}</span>
                                  {event.end_date && event.end_date !== event.start_date && <span>— {format(parseISO(event.end_date), "MMM d")}</span>}
                                  {event.start_time && (
                                    <>
                                      <Clock className="h-3 w-3 ml-1" />
                                      <span>{event.start_time}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[9px] shrink-0">
                                {EVENT_TYPES.find((t) => t.value === event.event_type)?.label || event.event_type}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {unassignedEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-muted-foreground mb-3">Other Events</h2>
            <Card>
              <CardContent className="pt-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {unassignedEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                    >
                      <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: event.color || "#64748b" }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(event.start_date), "MMM d, yyyy")}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedEvent?.color || "#64748b" }} />
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              <Badge variant="secondary">
                {EVENT_TYPES.find((t) => t.value === selectedEvent.event_type)?.label || selectedEvent.event_type}
              </Badge>
              <div className="text-sm">
                <p className="font-medium text-muted-foreground">Date</p>
                <p>
                  {format(parseISO(selectedEvent.start_date), "MMMM d, yyyy")}
                  {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date &&
                    ` — ${format(parseISO(selectedEvent.end_date), "MMMM d, yyyy")}`}
                </p>
              </div>
              {(selectedEvent.start_time || selectedEvent.end_time) && (
                <div className="text-sm">
                  <p className="font-medium text-muted-foreground">Time</p>
                  <p>{selectedEvent.start_time || ""}{selectedEvent.end_time ? ` — ${selectedEvent.end_time}` : ""}</p>
                </div>
              )}
              {selectedEvent.description && (
                <div className="text-sm">
                  <p className="font-medium text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const AcademicCalendar = () => {
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();

  return (
    <AppShell activeTab="schedule">
      <div className="py-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Academic Calendar</h1>
          <p className="text-muted-foreground">
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
