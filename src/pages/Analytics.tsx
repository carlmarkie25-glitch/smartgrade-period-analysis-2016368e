import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Award, AlertTriangle, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Analytics = () => {
  const topStudents = [
    { name: "Mary Johnson", class: "Grade 10A", average: 96 },
    { name: "James Brown", class: "Grade 11B", average: 94 },
    { name: "Sarah Davis", class: "Grade 9A", average: 93 },
    { name: "David Wilson", class: "Grade 10B", average: 91 },
    { name: "Lisa Anderson", class: "Grade 11A", average: 90 },
  ];

  const atRiskStudents = [
    { name: "Mike Taylor", class: "Grade 10A", failingSubjects: 4 },
    { name: "Emma Thomas", class: "Grade 9B", failingSubjects: 3 },
    { name: "Chris Martin", class: "Grade 11A", failingSubjects: 3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
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

          <Select defaultValue="p3">
            <SelectTrigger>
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p1">Period 1</SelectItem>
              <SelectItem value="p2">Period 2</SelectItem>
              <SelectItem value="p3">Period 3</SelectItem>
              <SelectItem value="yearly">Final Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">87%</div>
              <p className="text-xs text-success mt-1">+5% from last period</p>
              <p className="text-sm text-muted-foreground mt-2">1,086 / 1,247 students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fail Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">13%</div>
              <p className="text-xs text-destructive mt-1">-3% from last period</p>
              <p className="text-sm text-muted-foreground mt-2">161 / 1,247 students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">28</div>
              <p className="text-xs text-muted-foreground mt-1">Failing 3+ subjects</p>
              <p className="text-sm text-muted-foreground mt-2">2.2% of total students</p>
            </CardContent>
          </Card>
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
