import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Unlock } from "lucide-react";

const Gradebook = () => {
  const students = [
    { id: 1, name: "John Mensah", attendance: 5, participation: 4, project: 8, assignment: 9, quiz: 18, test: 45, total: 89 },
    { id: 2, name: "Mary Johnson", attendance: 5, participation: 5, project: 9, assignment: 10, quiz: 19, test: 48, total: 96 },
    { id: 3, name: "Peter Williams", attendance: 4, participation: 4, project: 7, assignment: 8, quiz: 16, test: 42, total: 81 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gradebook</h1>
            <p className="text-muted-foreground">Enter and manage student grades</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Lock className="h-4 w-4" />
            Locked
          </Button>
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

          <Select defaultValue="math">
            <SelectTrigger>
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="math">Mathematics</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="science">Science</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="p3">
            <SelectTrigger>
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p1">Period 1</SelectItem>
              <SelectItem value="p2">Period 2</SelectItem>
              <SelectItem value="p3">Period 3</SelectItem>
              <SelectItem value="p4">Period 4</SelectItem>
              <SelectItem value="p5">Period 5</SelectItem>
              <SelectItem value="p6">Period 6</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mathematics - Grade 10A - Period 3</CardTitle>
            <CardDescription>Assessment breakdown: Attendance (5), Participation (5), Project (10), Assignment (10), Quiz (20), Test (50)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Attend<br/>(5)</TableHead>
                    <TableHead className="text-center">Partic<br/>(5)</TableHead>
                    <TableHead className="text-center">Project<br/>(10)</TableHead>
                    <TableHead className="text-center">Assign<br/>(10)</TableHead>
                    <TableHead className="text-center">Quiz<br/>(20)</TableHead>
                    <TableHead className="text-center">Test<br/>(50)</TableHead>
                    <TableHead className="text-center font-bold">Total<br/>(100)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-center">{student.attendance}</TableCell>
                      <TableCell className="text-center">{student.participation}</TableCell>
                      <TableCell className="text-center">{student.project}</TableCell>
                      <TableCell className="text-center">{student.assignment}</TableCell>
                      <TableCell className="text-center">{student.quiz}</TableCell>
                      <TableCell className="text-center">{student.test}</TableCell>
                      <TableCell className="text-center font-bold text-primary">{student.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <Button variant="outline">Cancel</Button>
              <Button>Save Grades</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Gradebook;
