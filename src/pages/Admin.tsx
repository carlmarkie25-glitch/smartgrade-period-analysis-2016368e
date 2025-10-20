import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, UserPlus, School, BookOpen, FileText, Users } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { users, usersLoading, assignRole, removeRole } = useUserManagement();

  const [academicYearForm, setAcademicYearForm] = useState({
    year_name: "",
    start_date: "",
    end_date: "",
    is_current: false,
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    type: "elementary",
    description: "",
  });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [assessmentTypeForm, setAssessmentTypeForm] = useState({
    name: "",
    max_points: 100,
    display_order: 0,
  });

  const handleCreateAcademicYear = async () => {
    const { error } = await supabase.from("academic_years").insert(academicYearForm);
    if (error) {
      toast({ title: "Error creating academic year", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Academic year created successfully" });
      setAcademicYearForm({ year_name: "", start_date: "", end_date: "", is_current: false });
    }
  };

  const handleCreateDepartment = async () => {
    const { error } = await supabase.from("departments").insert([departmentForm as any]);
    if (error) {
      toast({ title: "Error creating department", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Department created successfully" });
      setDepartmentForm({ name: "", type: "elementary", description: "" });
    }
  };

  const handleCreateSubject = async () => {
    const { error } = await supabase.from("subjects").insert(subjectForm);
    if (error) {
      toast({ title: "Error creating subject", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Subject created successfully" });
      setSubjectForm({ name: "", code: "", description: "" });
    }
  };

  const handleCreateAssessmentType = async () => {
    const { error } = await supabase.from("assessment_types").insert(assessmentTypeForm);
    if (error) {
      toast({ title: "Error creating assessment type", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assessment type created successfully" });
      setAssessmentTypeForm({ name: "", max_points: 100, display_order: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <Button variant="outline" onClick={signOut}>Sign Out</Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">
              <UserPlus className="h-4 w-4 mr-2" />
              Users & Roles
            </TabsTrigger>
            <TabsTrigger value="academic">
              <School className="h-4 w-4 mr-2" />
              Academic Years
            </TabsTrigger>
            <TabsTrigger value="departments">
              <BookOpen className="h-4 w-4 mr-2" />
              Departments & Subjects
            </TabsTrigger>
            <TabsTrigger value="assessments">
              <FileText className="h-4 w-4 mr-2" />
              Assessment Types
            </TabsTrigger>
            <TabsTrigger value="classes">
              <Users className="h-4 w-4 mr-2" />
              Classes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User & Role Management</CardTitle>
                <CardDescription>Assign roles to users for testing</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p>Loading users...</p>
                ) : users && users.length > 0 ? (
                  <div className="space-y-4">
                    {users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex gap-2 mt-2">
                            {user.user_roles && user.user_roles.length > 0 ? (
                              user.user_roles.map((ur: any) => (
                                <span key={ur.role} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  {ur.role}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No roles assigned</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Select onValueChange={(role) => assignRole.mutate({ userId: user.user_id, role })}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Add role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No users found. Create accounts via the Auth page first.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic">
            <Card>
              <CardHeader>
                <CardTitle>Create Academic Year</CardTitle>
                <CardDescription>Set up academic years for testing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Year Name</Label>
                  <Input
                    placeholder="2024-2025"
                    value={academicYearForm.year_name}
                    onChange={(e) => setAcademicYearForm({ ...academicYearForm, year_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={academicYearForm.start_date}
                      onChange={(e) => setAcademicYearForm({ ...academicYearForm, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={academicYearForm.end_date}
                      onChange={(e) => setAcademicYearForm({ ...academicYearForm, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateAcademicYear}>Create Academic Year</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Create Department</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      placeholder="Mathematics Department"
                      value={departmentForm.name}
                      onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={departmentForm.type} onValueChange={(value) => setDepartmentForm({ ...departmentForm, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elementary">Elementary</SelectItem>
                        <SelectItem value="middle">Middle School</SelectItem>
                        <SelectItem value="high">High School</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      placeholder="Optional description"
                      value={departmentForm.description}
                      onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateDepartment}>Create Department</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Create Subject</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Subject Name</Label>
                    <Input
                      placeholder="Mathematics"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Subject Code</Label>
                    <Input
                      placeholder="MATH101"
                      value={subjectForm.code}
                      onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      placeholder="Optional description"
                      value={subjectForm.description}
                      onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateSubject}>Create Subject</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assessments">
            <Card>
              <CardHeader>
                <CardTitle>Create Assessment Type</CardTitle>
                <CardDescription>Define assessment types (Quiz, Test, Exam, etc.)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Assessment Name</Label>
                  <Input
                    placeholder="Quiz, Test, Midterm, Final"
                    value={assessmentTypeForm.name}
                    onChange={(e) => setAssessmentTypeForm({ ...assessmentTypeForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Points</Label>
                    <Input
                      type="number"
                      value={assessmentTypeForm.max_points}
                      onChange={(e) => setAssessmentTypeForm({ ...assessmentTypeForm, max_points: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={assessmentTypeForm.display_order}
                      onChange={(e) => setAssessmentTypeForm({ ...assessmentTypeForm, display_order: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateAssessmentType}>Create Assessment Type</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <CardTitle>Class Management</CardTitle>
                <CardDescription>Create classes and assign teachers (Coming soon)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Use the Gradebook page to create and manage classes once you have departments, academic years, and teachers set up.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
