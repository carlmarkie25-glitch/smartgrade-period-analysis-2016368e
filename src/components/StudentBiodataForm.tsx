import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, X } from "lucide-react";

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

interface ClassOption {
  id: string;
  name: string;
}

interface PhotoUploadSectionProps {
  preview: string | null;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isEdit?: boolean;
  isCreating: boolean;
  studentName: string;
  onClear: () => void;
}

const PhotoUploadSection = React.memo(({ 
  preview, 
  onSelect, 
  inputRef,
  isEdit = false,
  isCreating,
  studentName,
  onClear
}: PhotoUploadSectionProps) => (
  <div>
    <Label>Passport Photo</Label>
    <div className="flex items-center gap-4 mt-2">
      <Avatar className="h-20 w-20">
        <AvatarImage src={preview || ""} />
        <AvatarFallback className="text-xl">
          {studentName?.split(' ').map(n => n[0]).join('') || '?'}
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
            onClick={onClear}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  </div>
));

PhotoUploadSection.displayName = "PhotoUploadSection";

const FormSection = React.memo(({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3 pt-4 first:pt-0">
    <h4 className="font-semibold text-sm text-primary border-b pb-2">{title}</h4>
    <div className="grid grid-cols-2 gap-3">
      {children}
    </div>
  </div>
));

FormSection.displayName = "FormSection";

interface BiodataFormProps {
  student: StudentForm;
  onFieldChange: (field: keyof StudentForm, value: string) => void;
  isEdit?: boolean;
  photoPreview: string | null;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoClear: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  studentIdDisplay: string;
  classes: ClassOption[] | undefined;
  isCreating: boolean;
}

export const BiodataForm = ({
  student,
  onFieldChange,
  isEdit = false,
  photoPreview,
  onPhotoSelect,
  onPhotoClear,
  fileInputRef,
  studentIdDisplay,
  classes,
  isCreating
}: BiodataFormProps) => (
  <ScrollArea className="h-[70vh] pr-4">
    <div className="space-y-6">
      <PhotoUploadSection
        preview={photoPreview}
        onSelect={onPhotoSelect}
        inputRef={fileInputRef}
        isEdit={isEdit}
        isCreating={isCreating}
        studentName={student.full_name}
        onClear={onPhotoClear}
      />

      <FormSection title="Basic Information">
        <div>
          <Label htmlFor="student_id">Student ID</Label>
          <Input value={studentIdDisplay} disabled className="bg-muted font-mono" />
        </div>
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            value={student.full_name}
            onChange={(e) => onFieldChange("full_name", e.target.value)}
            placeholder="Enter full name"
          />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select value={student.gender} onValueChange={(value) => onFieldChange("gender", value)}>
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
            onChange={(e) => onFieldChange("date_of_birth", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            type="tel"
            value={student.phone_number}
            onChange={(e) => onFieldChange("phone_number", e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <Label htmlFor="religion">Religion</Label>
          <Input
            value={student.religion}
            onChange={(e) => onFieldChange("religion", e.target.value)}
            placeholder="Enter religion"
          />
        </div>
      </FormSection>

      <FormSection title="Location & Nationality">
        <div>
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            value={student.nationality}
            onChange={(e) => onFieldChange("nationality", e.target.value)}
            placeholder="Enter nationality"
          />
        </div>
        <div>
          <Label htmlFor="ethnicity">Ethnicity/Tribe</Label>
          <Input
            value={student.ethnicity}
            onChange={(e) => onFieldChange("ethnicity", e.target.value)}
            placeholder="Enter ethnicity"
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            value={student.country}
            onChange={(e) => onFieldChange("country", e.target.value)}
            placeholder="Enter country"
          />
        </div>
        <div>
          <Label htmlFor="county">County/State/Region</Label>
          <Input
            value={student.county}
            onChange={(e) => onFieldChange("county", e.target.value)}
            placeholder="Enter county/state"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="address">Home Address</Label>
          <Textarea
            value={student.address}
            onChange={(e) => onFieldChange("address", e.target.value)}
            placeholder="Enter full address"
            rows={2}
          />
        </div>
      </FormSection>

      <FormSection title="Academic Information">
        <div>
          <Label htmlFor="class_id">Current Class *</Label>
          <Select value={student.class_id} onValueChange={(value) => onFieldChange("class_id", value)}>
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
            onChange={(e) => onFieldChange("previous_school", e.target.value)}
            placeholder="Enter previous school"
          />
        </div>
        <div>
          <Label htmlFor="previous_class">Class in Previous School</Label>
          <Input
            value={student.previous_class}
            onChange={(e) => onFieldChange("previous_class", e.target.value)}
            placeholder="Enter previous class"
          />
        </div>
      </FormSection>

      <FormSection title="Parent/Guardian Information">
        <div>
          <Label htmlFor="father_name">Father's Name</Label>
          <Input
            value={student.father_name}
            onChange={(e) => onFieldChange("father_name", e.target.value)}
            placeholder="Enter father's name"
          />
        </div>
        <div>
          <Label htmlFor="father_contact">Father's Contact</Label>
          <Input
            type="tel"
            value={student.father_contact}
            onChange={(e) => onFieldChange("father_contact", e.target.value)}
            placeholder="Enter father's phone"
          />
        </div>
        <div>
          <Label htmlFor="mother_name">Mother's Name</Label>
          <Input
            value={student.mother_name}
            onChange={(e) => onFieldChange("mother_name", e.target.value)}
            placeholder="Enter mother's name"
          />
        </div>
        <div>
          <Label htmlFor="mother_contact">Mother's Contact</Label>
          <Input
            type="tel"
            value={student.mother_contact}
            onChange={(e) => onFieldChange("mother_contact", e.target.value)}
            placeholder="Enter mother's phone"
          />
        </div>
      </FormSection>

      <FormSection title="Emergency Contact">
        <div>
          <Label htmlFor="emergency_contact_name">Contact Name</Label>
          <Input
            value={student.emergency_contact_name}
            onChange={(e) => onFieldChange("emergency_contact_name", e.target.value)}
            placeholder="Emergency contact name"
          />
        </div>
        <div>
          <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
          <Input
            type="tel"
            value={student.emergency_contact_phone}
            onChange={(e) => onFieldChange("emergency_contact_phone", e.target.value)}
            placeholder="Emergency contact phone"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="emergency_contact_relationship">Relationship to Student</Label>
          <Input
            value={student.emergency_contact_relationship}
            onChange={(e) => onFieldChange("emergency_contact_relationship", e.target.value)}
            placeholder="e.g., Uncle, Aunt, Guardian"
          />
        </div>
      </FormSection>

      <FormSection title="Health Information">
        <div>
          <Label htmlFor="disability">Disability (if any)</Label>
          <Input
            value={student.disability}
            onChange={(e) => onFieldChange("disability", e.target.value)}
            placeholder="None or specify"
          />
        </div>
        <div>
          <Label htmlFor="health_issues">Health Issues</Label>
          <Input
            value={student.health_issues}
            onChange={(e) => onFieldChange("health_issues", e.target.value)}
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
            onChange={(e) => onFieldChange("password", e.target.value)}
            placeholder="Min 6 characters"
          />
        </div>
      </FormSection>
    </div>
  </ScrollArea>
);

export type { StudentForm };
