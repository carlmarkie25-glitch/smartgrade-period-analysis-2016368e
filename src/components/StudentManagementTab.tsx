import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, UserPlus, Upload, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentForm {
  full_name: string;
  class_id: string;
  department_id: string;
  date_of_birth: string;
  password: string;
  photo_url: string;
}

const initialFormState: StudentForm = {
  full_name: "",
  class_id: "",
  department_id: "",
  date_of_birth: "",
  password: "",
  photo_url: "",
};

const getNextStudentId = async (): Promise<string> => {
  const { data } = await supabase
    .from("students")
    .select("student_id")
    .order("student_id", { ascending: false });
  
  if (!data || data.length === 0) return "100";
  
  const maxId = Math.max(...data.map(s => parseInt(s.student_id) || 0));
  return String(Math.max(maxId + 1, 100));
};

export const StudentManagementTab = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentIdString, setEditingStudentIdString] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [nextStudentId, setNextStudentId] = useState<string>("Loading...");
  const [newStudent, setNewStudent] = useState<StudentForm>(initialFormState);
  const [editStudent, setEditStudent] = useState<StudentForm>(initialFormState);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const { data: students, isLoading } = useStudents();
  const { data: classes } = useClasses();
  const { toast } = useToast();
  const queryClient = useQueryClient();


  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditPhotoPreview(reader.result as string);
        } else {
          setPhotoPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.password || newStudent.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const selectedClass = classes?.find(c => c.id === newStudent.class_id);
      
      // Convert photo to base64 if selected
      let photoBase64 = "";
      let photoContentType = "";
      console.log("Add file input:", fileInputRef.current);
      console.log("Add file input files:", fileInputRef.current?.files);
      console.log("Add file input file[0]:", fileInputRef.current?.files?.[0]);
      
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        console.log("Uploading photo for add:", file.name, file.type, file.size);
        photoContentType = file.type;
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        photoBase64 = btoa(binary);
        console.log("Photo base64 length:", photoBase64.length);
      }

      console.log("Sending to edge function with photo:", !!photoBase64);
      const { data, error } = await supabase.functions.invoke("create-student-account", {
        body: {
          student_id: nextStudentId,
          password: newStudent.password,
          full_name: newStudent.full_name,
          class_id: newStudent.class_id,
          department_id: selectedClass?.department_id || newStudent.department_id,
          date_of_birth: newStudent.date_of_birth || null,
          photo_base64: photoBase64,
          photo_content_type: photoContentType,
        },
      });

      console.log("Create student response:", data, error);
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "Student account created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsAddDialogOpen(false);
      setNewStudent(initialFormState);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (student: any) => {
    setEditingStudentId(student.id);
    setEditingStudentIdString(student.student_id);
    setEditStudent({
      full_name: student.full_name,
      class_id: student.class_id,
      department_id: student.department_id,
      date_of_birth: student.date_of_birth || "",
      password: "",
      photo_url: student.photo_url || "",
    });
    setEditPhotoPreview(student.photo_url || null);
    setIsEditDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudentId) return;

    // Validate password if provided
    if (editStudent.password && editStudent.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const selectedClass = classes?.find(c => c.id === editStudent.class_id);
      
      // Upload new photo if selected via edge function
      let photoUrl = editStudent.photo_url;
      console.log("Edit file input:", editFileInputRef.current);
      console.log("Edit file input files:", editFileInputRef.current?.files);
      console.log("Edit file input file[0]:", editFileInputRef.current?.files?.[0]);
      
      if (editFileInputRef.current?.files?.[0]) {
        const file = editFileInputRef.current.files[0];
        console.log("Uploading photo for edit:", file.name, file.type, file.size);
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const photoBase64 = btoa(binary);
        console.log("Photo base64 length:", photoBase64.length);
        
        const { data: photoData, error: photoError } = await supabase.functions.invoke(
          "update-student-photo",
          {
            body: {
              student_id: editingStudentIdString,
              photo_base64: photoBase64,
              photo_content_type: file.type,
            },
          }
        );
        
        console.log("Photo upload response:", photoData, photoError);
        if (photoError) throw photoError;
        if (photoData?.error) throw new Error(photoData.error);
        if (photoData?.photo_url) photoUrl = photoData.photo_url;
      }

      // Update student record
      const { error } = await supabase
        .from("students")
        .update({
          full_name: editStudent.full_name,
          class_id: editStudent.class_id,
          department_id: selectedClass?.department_id || editStudent.department_id,
          date_of_birth: editStudent.date_of_birth || null,
          photo_url: photoUrl,
        })
        .eq("id", editingStudentId);

      if (error) throw error;

      // Update password if provided
      if (editStudent.password) {
        const { data: passwordData, error: passwordError } = await supabase.functions.invoke(
          "update-student-password",
          {
            body: {
              student_id: editingStudentId,
              new_password: editStudent.password,
            },
          }
        );

        if (passwordError) throw passwordError;
        if (passwordData?.error) throw new Error(passwordData.error);
      }

      toast({
        title: "Success",
        description: "Student updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsEditDialogOpen(false);
      setEditingStudentId(null);
      setEditStudent(initialFormState);
      setEditPhotoPreview(null);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Student deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const PhotoUploadSection = ({ 
    preview, 
    onSelect, 
    inputRef,
    isEdit = false 
  }: { 
    preview: string | null; 
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    isEdit?: boolean;
  }) => (
    <div>
      <Label>Student Photo</Label>
      <div className="flex items-center gap-4 mt-2">
        <Avatar className="h-20 w-20">
          <AvatarImage src={preview || ""} />
          <AvatarFallback className="text-xl">
            {isEdit ? editStudent.full_name?.split(' ').map(n => n[0]).join('') : newStudent.full_name?.split(' ').map(n => n[0]).join('') || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <input
            type="file"
            ref={inputRef}
            onChange={onSelect}
            accept="image/*"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isCreating}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {preview ? "Change Photo" : "Upload Photo"}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isEdit) {
                  setEditPhotoPreview(null);
                  setEditStudent({ ...editStudent, photo_url: "" });
                } else {
                  setPhotoPreview(null);
                }
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Student Management</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (open) {
            // Fetch next student ID when dialog opens
            getNextStudentId().then(setNextStudentId);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <PhotoUploadSection
                preview={photoPreview}
                onSelect={(e) => handlePhotoSelect(e, false)}
                inputRef={fileInputRef}
              />
              <div>
                <Label htmlFor="next_student_id">Student ID</Label>
                <Input
                  id="next_student_id"
                  value={nextStudentId}
                  disabled
                  className="bg-muted font-mono"
                />
              </div>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="class_id">Class</Label>
                <Select value={newStudent.class_id} onValueChange={(value) => setNewStudent({ ...newStudent, class_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={newStudent.date_of_birth}
                  onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Initial Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  placeholder="Min 6 characters"
                />
              </div>
              <Button onClick={handleAddStudent} className="w-full" disabled={isCreating}>
                {isCreating ? "Creating..." : "Add Student"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={student.photo_url || ""} />
                        <AvatarFallback>
                          {student.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.student_id}</TableCell>
                  <TableCell>{student.classes?.name}</TableCell>
                  <TableCell>{student.departments?.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(student)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <PhotoUploadSection
              preview={editPhotoPreview}
              onSelect={(e) => handlePhotoSelect(e, true)}
              inputRef={editFileInputRef}
              isEdit
            />
            <div>
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input
                id="edit_full_name"
                value={editStudent.full_name}
                onChange={(e) => setEditStudent({ ...editStudent, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit_student_id">Student ID</Label>
              <Input
                id="edit_student_id"
                value={editingStudentIdString}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="edit_class_id">Class</Label>
              <Select value={editStudent.class_id} onValueChange={(value) => setEditStudent({ ...editStudent, class_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_date_of_birth">Date of Birth</Label>
              <Input
                id="edit_date_of_birth"
                type="date"
                value={editStudent.date_of_birth}
                onChange={(e) => setEditStudent({ ...editStudent, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_password">New Password (leave blank to keep current)</Label>
              <Input
                id="edit_password"
                type="password"
                value={editStudent.password}
                onChange={(e) => setEditStudent({ ...editStudent, password: e.target.value })}
                placeholder="Min 6 characters"
              />
            </div>
            <Button onClick={handleUpdateStudent} className="w-full" disabled={isCreating}>
              {isCreating ? "Updating..." : "Update Student"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
