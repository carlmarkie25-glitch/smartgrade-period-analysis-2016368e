import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Award, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, useTopStudents, useAtRiskStudents } from "@/hooks/useAnalytics";
import { useState } from "react";

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("p3");
  
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics(selectedPeriod);
  const { data: topStudents = [], isLoading: topStudentsLoading } = useTopStudents(selectedPeriod);
  const { data: atRiskStudents = [], isLoading: atRiskLoading } = useAtRiskStudents(selectedPeriod);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">School-wide performance analysis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select defaultValue="2024-2025">
            <SelectTrigger>
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-2025">2024-2025</SelectItem>
              <SelectItem value="2023-2024">2023-2024</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p1">Period 1</SelectItem>
              <SelectItem value="p2">Period 2</SelectItem>
              <SelectItem value="p3">Period 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {analyticsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{analyticsData?.passRate}%</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {analyticsData?.passingStudents} / {analyticsData?.totalStudents} students
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Fail Rate</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{analyticsData?.failRate}%</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {analyticsData?.failingStudents} / {analyticsData?.totalStudents} students
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{atRiskStudents.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Failing 3+ subjects</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {analyticsData?.totalStudents ? 
                      ((atRiskStudents.length / analyticsData.totalStudents) * 100).toFixed(1) 
                      : 0}% of total students
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                School-Wide Top 5
              </CardTitle>
              <CardDescription>Highest performing students (Period 3)</CardDescription>
            </CardHeader>
            <CardContent>
              {topStudentsLoading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-8 w-12" />
                    </div>
                  ))}
                </div>
              ) : topStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No data available for this period</p>
              ) : (
                <div className="space-y-4">
                  {topStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <Avatar>
                          <AvatarImage src="" />
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.class}</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-primary">{student.average}%</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Students Needing Attention
              </CardTitle>
              <CardDescription>Students failing 3 or more subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {atRiskLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-8 w-12" />
                    </div>
                  ))}
                </div>
              ) : atRiskStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No at-risk students found</p>
              ) : (
                <div className="space-y-4">
                  {atRiskStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-warning/30 rounded-lg bg-warning/5">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src="" />
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.class}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-warning">{student.failingSubjects}</p>
                        <p className="text-xs text-muted-foreground">failing subjects</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
