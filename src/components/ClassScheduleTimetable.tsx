import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScheduleEntry {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id: string | null;
  teacher_id: string | null;
  classes: { id: string; name: string; department_id: string } | null;
  subjects: { id: string; name: string } | null;
  teachers: { id: string; full_name: string } | null;
}

interface Department {
  id: string;
  name: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon-Fri

const formatTime = (t: string) => {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

export const ClassScheduleTimetable = () => {
  const { data: departments, isLoading: deptLoading } = useQuery({
    queryKey: ["departments-for-timetable"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id,name").order("name");
      if (error) throw error;
      return data as Department[];
    },
  });

  const { data: schedules, isLoading: schedLoading } = useQuery({
    queryKey: ["class-schedules-timetable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_schedules")
        .select(
          `id, class_id, day_of_week, start_time, end_time, subject_id, teacher_id,
           classes(id, name, department_id),
           subjects(id, name),
           teachers:profiles!class_schedules_teacher_id_fkey(id, full_name)`
        )
        .order("start_time");
      if (error) throw error;
      return (data as unknown as ScheduleEntry[]) || [];
    },
  });

  const isLoading = deptLoading || schedLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!departments?.length) {
    return <p className="text-muted-foreground">No departments found.</p>;
  }

  // Group schedules by department
  const schedulesByDept: Record<string, ScheduleEntry[]> = {};
  for (const s of schedules || []) {
    const deptId = s.classes?.department_id;
    if (!deptId) continue;
    if (!schedulesByDept[deptId]) schedulesByDept[deptId] = [];
    schedulesByDept[deptId].push(s);
  }

  return (
    <Tabs defaultValue={departments[0]?.id} className="space-y-4">
      <TabsList className="flex-wrap h-auto gap-1">
        {departments.map((dept) => (
          <TabsTrigger key={dept.id} value={dept.id} className="text-xs sm:text-sm">
            {dept.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {departments.map((dept) => (
        <TabsContent key={dept.id} value={dept.id}>
          <DepartmentTimetable
            departmentName={dept.name}
            entries={schedulesByDept[dept.id] || []}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

interface DepartmentTimetableProps {
  departmentName: string;
  entries: ScheduleEntry[];
}

const DepartmentTimetable = ({ departmentName, entries }: DepartmentTimetableProps) => {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No schedule entries for {departmentName} yet.
        </CardContent>
      </Card>
    );
  }

  // Get unique classes sorted
  const classMap = new Map<string, string>();
  for (const e of entries) {
    if (e.classes) classMap.set(e.classes.id, e.classes.name);
  }
  const classes = Array.from(classMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  // Get unique time slots sorted
  const timeSlotSet = new Set<string>();
  for (const e of entries) {
    timeSlotSet.add(`${e.start_time}|${e.end_time}`);
  }
  const timeSlots = Array.from(timeSlotSet)
    .sort()
    .map((s) => {
      const [start, end] = s.split("|");
      return { start, end, key: s };
    });

  // Build lookup: day -> classId -> timeKey -> entry
  const lookup: Record<number, Record<string, Record<string, ScheduleEntry>>> = {};
  for (const e of entries) {
    if (!lookup[e.day_of_week]) lookup[e.day_of_week] = {};
    if (!lookup[e.day_of_week][e.class_id]) lookup[e.day_of_week][e.class_id] = {};
    lookup[e.day_of_week][e.class_id][`${e.start_time}|${e.end_time}`] = e;
  }

  // Filter to only days that have entries
  const activeDays = WEEKDAYS.filter((d) => lookup[d]);

  // Colors for subjects for visual distinction
  const subjectColors: Record<string, string> = {};
  const palette = [
    "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  ];
  let colorIdx = 0;
  for (const e of entries) {
    const name = e.subjects?.name || "—";
    if (!subjectColors[name]) {
      subjectColors[name] = palette[colorIdx % palette.length];
      colorIdx++;
    }
  }

  return (
    <div className="space-y-6">
      {activeDays.map((day) => (
        <Card key={day} className="overflow-hidden">
          <CardHeader className="py-3 bg-primary/5">
            <CardTitle className="text-base font-semibold">{DAYS[day]}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap min-w-[100px] border-r">
                      Classes
                    </th>
                    {timeSlots.map((ts) => (
                      <th
                        key={ts.key}
                        className="text-center px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap border-r last:border-r-0 min-w-[110px]"
                      >
                        <div className="text-[11px] leading-tight">
                          {formatTime(ts.start)}
                        </div>
                        <div className="text-[10px] text-muted-foreground/60">
                          {formatTime(ts.end)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls, idx) => (
                    <tr
                      key={cls.id}
                      className={cn(
                        "border-b last:border-b-0",
                        idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                      )}
                    >
                      <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap border-r">
                        {cls.name}
                      </td>
                      {timeSlots.map((ts) => {
                        const entry = lookup[day]?.[cls.id]?.[ts.key];
                        const subjectName = entry?.subjects?.name;
                        return (
                          <td
                            key={ts.key}
                            className="px-1.5 py-1.5 text-center border-r last:border-r-0"
                          >
                            {subjectName ? (
                              <div
                                className={cn(
                                  "rounded-md px-2 py-1.5 text-xs font-medium leading-tight",
                                  subjectColors[subjectName]
                                )}
                                title={entry?.teachers?.full_name ? `Teacher: ${entry.teachers.full_name}` : undefined}
                              >
                                {subjectName}
                              </div>
                            ) : entry ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {activeDays.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No timetable entries for {departmentName}.
        </p>
      )}
    </div>
  );
};
