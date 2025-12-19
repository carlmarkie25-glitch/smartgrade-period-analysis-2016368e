import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, UserPlus, Upload, X, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudentBiodataDialog } from "./StudentBiodataDialog";

interface StudentForm {
  full_name: string;
  class_id: string;
  department_id: string;
  date_of_birth: string;
  password: string;
  photo_url: string;
  phone_number: string;
  gender: string;
  nationality: string;
  ethnicity: string;
  county: string;
  country: string;
  religion: string;
  disability: string;
  health_issues: string;
  father_name: string;
  father_contact: string;
  mother_name: string;
  mother_contact: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  previous_school: string;
  previous_class: string;
  address: string;
}

const initialFormState: StudentForm = {
  full_name: "",
  class_id: "",
  department_id: "",
  date_of_birth: "",
  password: "",
  photo_url: "",
  phone_number: "",
  gender: "",
  nationality: "",
  ethnicity: "",
  county: "",
  country: "",
  religion: "",
  disability: "",
  health_issues: "",
  father_name: "",
  father_contact: "",
  mother_name: "",
  mother_contact: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",
  previous_school: "",
  previous_class: "",
  address: "",
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
  const [isBiodataDialogOpen, setIsBiodataDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
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
      
      let photoBase64 = "";
      let photoContentType = "";
      
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        photoContentType = file.type;
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        photoBase64 = btoa(binary);
      }

      const { data, error } = await supabase.functions.invoke("create-student-account", {
        body: {
          student_id: nextStudentId,
          password: newStudent.password,
          full_name: newStudent.full_name,
          class_id: newStudent.class_id,
          department_id: selectedClass?.department_id || newStudent.department_id,
          date_of_birth: newStudent.date_of_birth || null,
          phone_number: newStudent.phone_number || null,
          gender: newStudent.gender || null,
          nationality: newStudent.nationality || null,
          ethnicity: newStudent.ethnicity || null,
          county: newStudent.county || null,
          country: newStudent.country || null,
          religion: newStudent.religion || null,
          disability: newStudent.disability || null,
          health_issues: newStudent.health_issues || null,
          father_name: newStudent.father_name || null,
          father_contact: newStudent.father_contact || null,
          mother_name: newStudent.mother_name || null,
          mother_contact: newStudent.mother_contact || null,
          emergency_contact_name: newStudent.emergency_contact_name || null,
          emergency_contact_phone: newStudent.emergency_contact_phone || null,
          emergency_contact_relationship: newStudent.emergency_contact_relationship || null,
          previous_school: newStudent.previous_school || null,
          previous_class: newStudent.previous_class || null,
          address: newStudent.address || null,
          photo_base64: photoBase64,
          photo_content_type: photoContentType,
        },
      });

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
      phone_number: student.phone_number || "",
      gender: student.gender || "",
      nationality: student.nationality || "",
      ethnicity: student.ethnicity || "",
      county: student.county || "",
      country: student.country || "",
      religion: student.religion || "",
      disability: student.disability || "",
      health_issues: student.health_issues || "",
      father_name: student.father_name || "",
      father_contact: student.father_contact || "",
      mother_name: student.mother_name || "",
      mother_contact: student.mother_contact || "",
      emergency_contact_name: student.emergency_contact_name || "",
      emergency_contact_phone: student.emergency_contact_phone || "",
      emergency_contact_relationship: student.emergency_contact_relationship || "",
      previous_school: student.previous_school || "",
      previous_class: student.previous_class || "",
      address: student.address || "",
    });
    setEditPhotoPreview(student.photo_url || null);
    setIsEditDialogOpen(true);
  };

  const handleViewBiodata = (student: any) => {
    setSelectedStudent(student);
    setIsBiodataDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudentId) return;

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
      
      let photoUrl = editStudent.photo_url;
      
      if (editFileInputRef.current?.files?.[0]) {
        const file = editFileInputRef.current.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const photoBase64 = btoa(binary);
        
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
        
        if (photoError) throw photoError;
        if (photoData?.error) throw new Error(photoData.error);
        if (photoData?.photo_url) photoUrl = photoData.photo_url;
      }

      const { error } = await supabase
        .from("students")
        .update({
          full_name: editStudent.full_name,
          class_id: editStudent.class_id,
          department_id: selectedClass?.department_id || editStudent.department_id,
          date_of_birth: editStudent.date_of_birth || null,
          photo_url: photoUrl,
          phone_number: editStudent.phone_number || null,
          gender: editStudent.gender || null,
          nationality: editStudent.nationality || null,
          ethnicity: editStudent.ethnicity || null,
          county: editStudent.county || null,
          country: editStudent.country || null,
          religion: editStudent.religion || null,
          disability: editStudent.disability || null,
          health_issues: editStudent.health_issues || null,
          father_name: editStudent.father_name || null,
          father_contact: editStudent.father_contact || null,
          mother_name: editStudent.mother_name || null,
          mother_contact: editStudent.mother_contact || null,
          emergency_contact_name: editStudent.emergency_contact_name || null,
          emergency_contact_phone: editStudent.emergency_contact_phone || null,
          emergency_contact_relationship: editStudent.emergency_contact_relationship || null,
          previous_school: editStudent.previous_school || null,
          previous_class: editStudent.previous_class || null,
          address: editStudent.address || null,
        })
        .eq("id", editingStudentId);

      if (error) throw error;

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
      <Label>Passport Photo</Label>
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

  const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3 pt-4 first:pt-0">
      <h4 className="font-semibold text-sm text-primary border-b pb-2">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );

  const BiodataForm = ({ 
    student, 
    setStudent, 
    isEdit = false,
    photoPreview,
    onPhotoSelect,
    fileInputRef,
    nextStudentId
  }: { 
    student: StudentForm; 
    setStudent: (s: StudentForm) => void;
    isEdit?: boolean;
    photoPreview: string | null;
    onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    nextStudentId?: string;
  }) => (
    <ScrollArea className="h-[70vh] pr-4">
      <div className="space-y-6">
        <PhotoUploadSection
          preview={photoPreview}
          onSelect={onPhotoSelect}
          inputRef={fileInputRef}
          isEdit={isEdit}
        />

        <FormSection title="Basic Information">
          {!isEdit && (
            <div>
              <Label htmlFor="student_id">Student ID</Label>
              <Input value={nextStudentId} disabled className="bg-muted font-mono" />
            </div>
          )}
          {isEdit && (
            <div>
              <Label htmlFor="student_id">Student ID</Label>
              <Input value={editingStudentIdString} disabled className="bg-muted font-mono" />
            </div>
          )}
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              value={student.full_name}
              onChange={(e) => setStudent({ ...student, full_name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={student.gender} onValueChange={(value) => setStudent({ ...student, gender: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              type="date"
              value={student.date_of_birth}
              onChange={(e) => setStudent({ ...student, date_of_birth: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              type="tel"
              value={student.phone_number}
              onChange={(e) => setStudent({ ...student, phone_number: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <Label htmlFor="religion">Religion</Label>
            <Input
              value={student.religion}
              onChange={(e) => setStudent({ ...student, religion: e.target.value })}
              placeholder="Enter religion"
            />
          </div>
        </FormSection>

        <FormSection title="Location & Nationality">
          <div>
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              value={student.nationality}
              onChange={(e) => setStudent({ ...student, nationality: e.target.value })}
              placeholder="Enter nationality"
            />
          </div>
          <div>
            <Label htmlFor="ethnicity">Ethnicity/Tribe</Label>
            <Input
              value={student.ethnicity}
              onChange={(e) => setStudent({ ...student, ethnicity: e.target.value })}
              placeholder="Enter ethnicity"
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              value={student.country}
              onChange={(e) => setStudent({ ...student, country: e.target.value })}
              placeholder="Enter country"
            />
          </div>
          <div>
            <Label htmlFor="county">County/State/Region</Label>
            <Input
              value={student.county}
              onChange={(e) => setStudent({ ...student, county: e.target.value })}
              placeholder="Enter county/state"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="address">Home Address</Label>
            <Textarea
              value={student.address}
              onChange={(e) => setStudent({ ...student, address: e.target.value })}
              placeholder="Enter full address"
              rows={2}
            />
          </div>
        </FormSection>

        <FormSection title="Academic Information">
          <div>
            <Label htmlFor="class_id">Current Class *</Label>
            <Select value={student.class_id} onValueChange={(value) => setStudent({ ...student, class_id: value })}>
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
            <Label htmlFor="previous_school">Previous School</Label>
            <Input
              value={student.previous_school}
              onChange={(e) => setStudent({ ...student, previous_school: e.target.value })}
              placeholder="Enter previous school"
            />
          </div>
          <div>
            <Label htmlFor="previous_class">Class in Previous School</Label>
            <Input
              value={student.previous_class}
              onChange={(e) => setStudent({ ...student, previous_class: e.target.value })}
              placeholder="Enter previous class"
            />
          </div>
        </FormSection>

        <FormSection title="Parent/Guardian Information">
          <div>
            <Label htmlFor="father_name">Father's Name</Label>
            <Input
              value={student.father_name}
              onChange={(e) => setStudent({ ...student, father_name: e.target.value })}
              placeholder="Enter father's name"
            />
          </div>
          <div>
            <Label htmlFor="father_contact">Father's Contact</Label>
            <Input
              type="tel"
              value={student.father_contact}
              onChange={(e) => setStudent({ ...student, father_contact: e.target.value })}
              placeholder="Enter father's phone"
            />
          </div>
          <div>
            <Label htmlFor="mother_name">Mother's Name</Label>
            <Input
              value={student.mother_name}
              onChange={(e) => setStudent({ ...student, mother_name: e.target.value })}
              placeholder="Enter mother's name"
            />
          </div>
          <div>
            <Label htmlFor="mother_contact">Mother's Contact</Label>
            <Input
              type="tel"
              value={student.mother_contact}
              onChange={(e) => setStudent({ ...student, mother_contact: e.target.value })}
              placeholder="Enter mother's phone"
            />
          </div>
        </FormSection>

        <FormSection title="Emergency Contact">
          <div>
            <Label htmlFor="emergency_contact_name">Contact Name</Label>
            <Input
              value={student.emergency_contact_name}
              onChange={(e) => setStudent({ ...student, emergency_contact_name: e.target.value })}
              placeholder="Emergency contact name"
            />
          </div>
          <div>
            <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
            <Input
              type="tel"
              value={student.emergency_contact_phone}
              onChange={(e) => setStudent({ ...student, emergency_contact_phone: e.target.value })}
              placeholder="Emergency contact phone"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="emergency_contact_relationship">Relationship to Student</Label>
            <Input
              value={student.emergency_contact_relationship}
              onChange={(e) => setStudent({ ...student, emergency_contact_relationship: e.target.value })}
              placeholder="e.g., Uncle, Aunt, Guardian"
            />
          </div>
        </FormSection>

        <FormSection title="Health Information">
          <div>
            <Label htmlFor="disability">Disability (if any)</Label>
            <Input
              value={student.disability}
              onChange={(e) => setStudent({ ...student, disability: e.target.value })}
              placeholder="None or specify"
            />
          </div>
          <div>
            <Label htmlFor="health_issues">Health Issues</Label>
            <Input
              value={student.health_issues}
              onChange={(e) => setStudent({ ...student, health_issues: e.target.value })}
              placeholder="None or specify"
            />
          </div>
        </FormSection>

        <FormSection title="Account Security">
          <div className="col-span-2">
            <Label htmlFor="password">{isEdit ? "New Password (leave blank to keep current)" : "Initial Password *"}</Label>
            <Input
              type="password"
              value={student.password}
              onChange={(e) => setStudent({ ...student, password: e.target.value })}
              placeholder="Min 6 characters"
            />
          </div>
        </FormSection>
      </div>
    </ScrollArea>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Student Management</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (open) {
            getNextStudentId().then(setNextStudentId);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Student Biodata Form</DialogTitle>
            </DialogHeader>
            <BiodataForm
              student={newStudent}
              setStudent={setNewStudent}
              photoPreview={photoPreview}
              onPhotoSelect={(e) => handlePhotoSelect(e, false)}
              fileInputRef={fileInputRef}
              nextStudentId={nextStudentId}
            />
            <Button onClick={handleAddStudent} className="w-full" disabled={isCreating}>
              {isCreating ? "Creating..." : "Add Student"}
            </Button>
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
                        onClick={() => handleViewBiodata(student)}
                        title="View Biodata"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(student)}
                        title="Edit Student"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                        title="Delete Student"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Student Biodata</DialogTitle>
          </DialogHeader>
          <BiodataForm
            student={editStudent}
            setStudent={setEditStudent}
            isEdit
            photoPreview={editPhotoPreview}
            onPhotoSelect={(e) => handlePhotoSelect(e, true)}
            fileInputRef={editFileInputRef}
          />
          <Button onClick={handleUpdateStudent} className="w-full" disabled={isCreating}>
            {isCreating ? "Updating..." : "Update Student"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Biodata View Dialog */}
      <StudentBiodataDialog
        student={selectedStudent}
        open={isBiodataDialogOpen}
        onOpenChange={setIsBiodataDialogOpen}
      />
    </Card>
  );
};
