import React from "react";
import MainLayout from "@/components/MainLayout";
import { useSchedule } from "@/hooks/useSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const Schedule = () => {
  const { data, isLoading, error } = useSchedule();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Today's Schedule</h1>
        {isLoading && <Skeleton className="h-6 w-40 mb-4" />}
        {error && <p className="text-red-500">Failed to load schedule.</p>}
        {!isLoading && data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle>{item.subject || "Class"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    {format(new Date(`${item.date}T${item.start_time}`), "p")} -{' '}
                    {format(new Date(`${item.date}T${item.end_time}`), "p")}
                  </p>
                  {item.location && <p>{item.location}</p>}
                  {(item as any).teacher_name && (
                    <p className="text-sm text-muted-foreground">Teacher: {(item as any).teacher_name}</p>
                  )}
                  {/* if internal class schedule flag maybe show differently */}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !isLoading && <p className="text-muted-foreground">No scheduled activities for today.</p>
        )}
      </div>
    </MainLayout>
  );
};

export default Schedule;
