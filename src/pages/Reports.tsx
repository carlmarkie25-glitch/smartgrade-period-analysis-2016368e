import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Reports = () => {
  const students = [
    { id: 1, name: "John Mensah", class: "Grade 10A", average: 85, rank: 5 },
    { id: 2, name: "Mary Johnson", class: "Grade 10A", average: 92, rank: 1 },
    { id: 3, name: "Peter Williams", class: "Grade 10A", average: 78, rank: 12 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-muted-foreground">Generate and view student report cards</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select defaultValue="grade10a">
            <SelectTrigger>
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade10a">Grade 10A</SelectItem>
              <SelectItem value="grade10b">Grade 10B</SelectItem>
              <SelectItem value="grade11a">Grade 11A</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="p3">
            <SelectTrigger>
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p1">Period 1 Report</SelectItem>
              <SelectItem value="p2">Period 2 Report</SelectItem>
              <SelectItem value="p3">Period 3 Report</SelectItem>
              <SelectItem value="yearly">Final Yearly Report</SelectItem>
            </SelectContent>
          </Select>

          <Button className="gap-2">
            <FileText className="h-4 w-4" />
            Generate All Reports
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Report Cards - Period 3</CardTitle>
            <CardDescription>View and download individual student reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Average</p>
                      <p className="text-xl font-bold text-primary">{student.average}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Rank</p>
                      <p className="text-xl font-bold text-foreground">#{student.rank}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;
