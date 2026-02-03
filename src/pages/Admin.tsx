import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, School, BookOpen, Users, GraduationCap, Building, X, Settings2 } from "lucide-react";
import { StudentManagementTab } from "@/components/StudentManagementTab";
import { ClassManagementTab } from "@/components/ClassManagementTab";
import { SubjectManagementTab } from "@/components/SubjectManagementTab";
import { DepartmentManagementTab } from "@/components/DepartmentManagementTab";
import { TeacherAssignmentDialog } from "@/components/TeacherAssignmentDialog";
import MainLayout from "@/components/MainLayout";

const Admin = () => {
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
    description: "",
  });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [teacherAssignmentOpen, setTeacherAssignmentOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{
    id: string;
    user_id: string;
    full_name: string;
  } | null>(null);

  const handleOpenTeacherAssignment = (user: any) => {
    setSelectedTeacher({
      id: user.id,
      user_id: user.user_id,
      full_name: user.full_name,
    });
    setTeacherAssignmentOpen(true);
  };

  const isTeacher = (user: any) => {
    return user.user_roles?.some((ur: any) => ur.role === "teacher");
  };

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
    const { error } = await supabase.from("departments").insert([departmentForm]);
    if (error) {
      toast({ title: "Error creating department", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Department created successfully" });
      setDepartmentForm({ name: "", description: "" });
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


  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, students, classes, and more</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">
              <UserPlus className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="students">
              <GraduationCap className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="classes">
              <Building className="h-4 w-4 mr-2" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="subjects">
              <BookOpen className="h-4 w-4 mr-2" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="academic">
              <School className="h-4 w-4 mr-2" />
              Years
            </TabsTrigger>
            <TabsTrigger value="departments">
              <Users className="h-4 w-4 mr-2" />
              Departments
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
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {user.user_roles && user.user_roles.length > 0 ? (
                              user.user_roles.map((ur: any) => (
                                <span key={ur.role} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
                                  {ur.role}
                                  <button
                                    onClick={() => removeRole.mutate({ userId: user.user_id, role: ur.role })}
                                    className="hover:bg-destructive/20 rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No roles assigned</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isTeacher(user) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenTeacherAssignment(user)}
                            >
                              <Settings2 className="h-4 w-4 mr-1" />
                              Assign Classes
                            </Button>
                          )}
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

          <TabsContent value="students">
            <StudentManagementTab />
          </TabsContent>

          <TabsContent value="classes">
            <ClassManagementTab />
          </TabsContent>

          <TabsContent value="subjects">
            <SubjectManagementTab />
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
            <DepartmentManagementTab />
          </TabsContent>
        </Tabs>
      </div>

      <TeacherAssignmentDialog
        open={teacherAssignmentOpen}
        onOpenChange={setTeacherAssignmentOpen}
        teacher={selectedTeacher}
      />
    </MainLayout>
  );
};

export default Admin;
