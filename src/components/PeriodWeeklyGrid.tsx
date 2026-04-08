import { useMemo } from "react";
import { format, parseISO, addDays, startOfWeek, isSameDay, isWithinInterval, getDay } from "date-fns";
import type { AcademicPeriod } from "@/hooks/useAcademicPeriods";
import type { AcademicEvent } from "@/hooks/useAcademicEvents";

interface Props {
  period: AcademicPeriod;
  events: AcademicEvent[];
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const PeriodWeeklyGrid = ({ period, events }: Props) => {
  const weeks = useMemo(() => {
    const start = parseISO(period.start_date);
    const end = parseISO(period.end_date);
    const result: Date[][] = [];

    // Find the Monday of the first week
    let weekStart = startOfWeek(start, { weekStartsOn: 1 });

    while (weekStart <= end) {
      const week: Date[] = [];
      for (let d = 0; d < 5; d++) {
        week.push(addDays(weekStart, d));
      }
      result.push(week);
      weekStart = addDays(weekStart, 7);
    }
    return result;
  }, [period.start_date, period.end_date]);

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eStart = parseISO(event.start_date);
      const eEnd = event.end_date ? parseISO(event.end_date) : eStart;
      try {
        return isSameDay(day, eStart) || isSameDay(day, eEnd) ||
          isWithinInterval(day, { start: eStart, end: eEnd });
      } catch {
        return isSameDay(day, eStart);
      }
    });
  };

  const periodStart = parseISO(period.start_date);
  const periodEnd = parseISO(period.end_date);
  const isInPeriod = (day: Date) => {
    try {
      return isWithinInterval(day, { start: periodStart, end: periodEnd });
    } catch {
      return false;
    }
  };

  const headerText = `${period.label} (${format(periodStart, "MMM. dd")}—${format(periodEnd, "MMM dd, yyyy")})`;

  return (
    <div className="mb-8 overflow-x-auto">
      {/* Period header */}
      <div
        className="text-center py-2 px-4 font-bold text-white text-sm rounded-t-xl"
        style={{ background: "hsl(170, 35%, 30%)" }}
      >
        {headerText}
      </div>

      {/* Weekly table */}
      <table className="w-full border-collapse text-sm" style={{ minWidth: 600 }}>
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th
                key={day}
                className="border border-border/50 px-2 py-2 text-xs font-bold text-foreground"
                style={{
                  background: "hsl(170, 25%, 92%)",
                  width: "20%",
                }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                const inPeriod = isInPeriod(day);
                const dayEvents = getEventsForDay(day);
                const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                const isToday = isSameDay(day, new Date());

                return (
                  <td
                    key={di}
                    className={`border border-border/40 px-2 py-1.5 align-top transition-colors ${
                      !inPeriod ? "opacity-30" : ""
                    } ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                    style={{
                      background: inPeriod
                        ? dayEvents.some((e) => e.event_type === "holiday")
                          ? "hsl(170, 30%, 90%)"
                          : "hsl(170, 25%, 96%)"
                        : "hsl(170, 15%, 97%)",
                      minHeight: 48,
                    }}
                  >
                    <div className="font-semibold text-xs text-muted-foreground mb-0.5">
                      {format(day, "d")}
                    </div>
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="text-[10px] leading-tight px-1 py-0.5 rounded mb-0.5 font-medium truncate"
                        style={{
                          backgroundColor: event.color ? `${event.color}25` : "hsl(170, 30%, 88%)",
                          color: event.color || "hsl(170, 35%, 25%)",
                          borderLeft: `2px solid ${event.color || "hsl(170, 35%, 30%)"}`,
                        }}
                        title={event.title + (event.description ? ` — ${event.description}` : "")}
                      >
                        {event.title}
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PeriodWeeklyGrid;
