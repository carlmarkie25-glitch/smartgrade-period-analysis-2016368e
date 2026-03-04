import { useState, useMemo } from "react";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAcademicEvents, EVENT_TYPES, type AcademicEvent } from "@/hooks/useAcademicEvents";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isSameMonth, isWithinInterval, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const AcademicCalendar = () => {
  const { data: events, isLoading } = useAcademicEvents();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad start with empty days
    const startPadding = getDay(monthStart);
    return { days, startPadding };
  }, [currentMonth]);

  const getEventsForDay = (day: Date) => {
    if (!events) return [];
    return events.filter((event) => {
      const start = parseISO(event.start_date);
      const end = event.end_date ? parseISO(event.end_date) : start;
      return isSameDay(day, start) || isSameDay(day, end) || isWithinInterval(day, { start, end });
    });
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Academic Calendar</h1>
          <p className="text-muted-foreground">View upcoming academic events and activities</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-xl">{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Loading calendar...</p>
            ) : (
              <>
                {/* Week header */}
                <div className="grid grid-cols-7 mb-2">
                  {weekDays.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {/* Padding for start of month */}
                  {Array.from({ length: calendarDays.startPadding }).map((_, i) => (
                    <div key={`pad-${i}`} className="bg-muted/30 min-h-[90px] p-1" />
                  ))}

                  {calendarDays.days.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div
                        key={day.toISOString()}
                        className={`bg-card min-h-[90px] p-1 transition-colors ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                      >
                        <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary font-bold" : "text-foreground"}`}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="w-full text-left rounded px-1 py-0.5 text-[10px] leading-tight truncate hover:opacity-80 transition-opacity text-white"
                              style={{ backgroundColor: event.color || "#64748b" }}
                            >
                              {event.title}
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <p className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Padding for end of month */}
                  {Array.from({ length: (7 - ((calendarDays.startPadding + calendarDays.days.length) % 7)) % 7 }).map((_, i) => (
                    <div key={`endpad-${i}`} className="bg-muted/30 min-h-[90px] p-1" />
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {EVENT_TYPES.map((t) => (
                    <div key={t.value} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="text-xs text-muted-foreground">{t.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming events list */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {!events || events.filter((e) => new Date(e.start_date) >= new Date(new Date().toISOString().split("T")[0])).length === 0 ? (
              <p className="text-muted-foreground">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {events
                  .filter((e) => new Date(e.start_date) >= new Date(new Date().toISOString().split("T")[0]))
                  .slice(0, 10)
                  .map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedEvent(event)}>
                      <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: event.color || "#64748b" }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(event.start_date), "MMM d, yyyy")}
                          {event.end_date && event.end_date !== event.start_date && ` — ${format(parseISO(event.end_date), "MMM d, yyyy")}`}
                          {event.start_time && ` · ${event.start_time}`}
                        </p>
                        {event.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.description}</p>}
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {EVENT_TYPES.find((t) => t.value === event.event_type)?.label || event.event_type}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                <div>
                  <Badge variant="secondary">
                    {EVENT_TYPES.find((t) => t.value === selectedEvent.event_type)?.label || selectedEvent.event_type}
                  </Badge>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-muted-foreground">Date</p>
                  <p>
                    {format(parseISO(selectedEvent.start_date), "MMMM d, yyyy")}
                    {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && ` — ${format(parseISO(selectedEvent.end_date), "MMMM d, yyyy")}`}
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
      </div>
    </MainLayout>
  );
};

export default AcademicCalendar;
